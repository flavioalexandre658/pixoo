import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db";
import { generatedImages } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import {
  confirmCreditsWebhook,
  cancelReservationWebhook,
} from "../../../../actions/credits";
import { getImageByTaskIdInternal } from "@/actions/images/get-by-task-id/get-image-by-task-id.action";
import { uploadImageToS3, downloadImageFromUrl, generateS3FileName } from "@/lib/s3";

// Interface para o payload do webhook da BFL
interface WebhookPayload {
  task_id: string;
  status: "SUCCESS" | "FAILED" | "PENDING" | "processing";
  result?: {
    sample: string; // URL da imagem gerada
    seed?: number;
    start_time?: number;
    end_time?: number;
    duration?: number;
    pre_filtered?: boolean;
  };
  error?: string;
  progress?: number;
}

// Store temporário para resultados (em produção, usar banco de dados)
const webhookResults = new Map<string, WebhookPayload>();

export async function POST(request: NextRequest) {
  console.log("🔔 Webhook BFL chamado:", {
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(request.headers.entries()),
    url: request.url,
  });

  try {
    const body = await request.text();
    console.log("📦 Payload recebido:", body);

    const payload: WebhookPayload = JSON.parse(body);

    console.log("📥 Webhook BFL recebido:", {
      taskId: payload.task_id,
      status: payload.status,
      hasResult: !!payload.result,
      resultSample: payload.result?.sample,
      resultSampleLength: payload.result?.sample?.length,
      resultSampleValid: payload.result?.sample ? /^https?:\/\/.+/.test(payload.result.sample) : false,
      error: payload.error,
      progress: payload.progress,
      fullPayload: JSON.stringify(payload, null, 2)
    });

    // Log adicional para debug de URLs problemáticas
    if (payload.result?.sample) {
      console.log('🔍 Análise detalhada da URL da BFL:', {
        taskId: payload.task_id,
        url: payload.result.sample,
        urlType: typeof payload.result.sample,
        urlLength: payload.result.sample.length,
        startsWithHttp: payload.result.sample.startsWith('http'),
        startsWithHttps: payload.result.sample.startsWith('https'),
        containsDelivery: payload.result.sample.includes('delivery'),
        containsBfl: payload.result.sample.includes('bfl'),
        urlParts: payload.result.sample.split('/').slice(0, 5), // Primeiras 5 partes da URL
      });
    }

    const mappedStatus =
      payload.status === "SUCCESS"
        ? "Ready"
        : payload.status === "FAILED"
        ? "Error"
        : payload.status === "PENDING"
        ? "Pending"
        : payload.status === "processing"
        ? "Processing"
        : "Error";
    if (mappedStatus === "Ready") {
      webhookResults.set(payload.task_id, payload);
      
      try {
        // Implementar retry para resolver problema de timing
        let res = null;
        let retryCount = 0;
        const maxRetries = 5;
        const retryDelay = 1000; // 1 segundo
        
        while (retryCount < maxRetries) {
          try {
            res = await getImageByTaskIdInternal(payload.task_id);
            
            if (res.success) {
              console.log(`✅ Imagem encontrada na tentativa ${retryCount + 1}:`, {
                taskId: payload.task_id,
                attempt: retryCount + 1
              });
              break;
            } else {
              retryCount++;
              if (retryCount < maxRetries) {
                console.log(`⏳ Tentativa ${retryCount}/${maxRetries} - Aguardando ${retryDelay}ms antes de tentar novamente...`, {
                  taskId: payload.task_id
                });
                await new Promise(resolve => setTimeout(resolve, retryDelay));
              }
            }
          } catch (error) {
            retryCount++;
            console.error(`❌ Erro na tentativa ${retryCount}:`, error);
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
          }
        }
        
        if (!res || !res.success) {
          console.error(
            `❌ Image record not found after ${maxRetries} attempts for task: ${payload.task_id}`,
            res?.errors
          );
          return NextResponse.json(
            { error: "Image record not found after retries" },
            { status: 404 }
          );
        }

        const imageRecord = res.data;

        let s3ImageUrl = payload.result?.sample || null;
        let uploadSuccess = false;
        
        // Validar e fazer upload da imagem para o S3
        if (payload.result?.sample && imageRecord) {
          try {
            // Validar a URL da BFL primeiro
            const bflUrl = payload.result.sample;

            console.log('🔄 Iniciando upload da imagem para S3:', {
              taskId: payload.task_id,
              originalUrl: bflUrl,
              userId: imageRecord.userId
            });

            // Baixar a imagem da URL da BFL com retry e timeout configurados
            const imageBuffer = await downloadImageFromUrl(
              bflUrl,
              3, // 3 tentativas (aumentado de 1)
              60000 // 60 segundos de timeout (aumentado de 45s)
            );
            
            // Gerar nome único para o arquivo no S3
            const s3FileName = generateS3FileName(
              payload.task_id,
              imageRecord.userId,
              'jpg'
            );
            
            // Fazer upload para o S3
            s3ImageUrl = await uploadImageToS3(
              imageBuffer,
              s3FileName,
              'image/jpeg'
            );
            
            uploadSuccess = true;
            
            console.log('✅ Upload para S3 concluído:', {
              taskId: payload.task_id,
              s3Url: s3ImageUrl,
              fileName: s3FileName,
              uploadSuccess
            });
          } catch (s3Error) {
            console.error('❌ Erro no upload para S3, usando URL original:', {
              taskId: payload.task_id,
              error: s3Error instanceof Error ? s3Error.message : 'Erro desconhecido',
              originalUrl: payload.result.sample,
              uploadSuccess: false
            });
            // Em caso de erro no S3, manter a URL original da BFL
            s3ImageUrl = payload.result.sample;
          }
        }

        const updateData: any = {
          status: "ready",
          imageUrl: s3ImageUrl,
          completedAt: new Date(),
        };

        if (payload.result?.seed) {
          updateData.seed = payload.result.seed;
        }

        if (payload.result?.duration) {
          updateData.generationTimeMs = Math.round(payload.result.duration * 1000);
        }

        console.log(`✅ Atualizando imagem para status ready:`, {
          taskId: payload.task_id,
          imageUrl: updateData.imageUrl,
          completedAt: updateData.completedAt,
          uploadedToS3: uploadSuccess,
          usingS3Url: s3ImageUrl !== payload.result?.sample
        });

        // Atualizar registro da imagem
        await db
          .update(generatedImages)
          .set(updateData)
          .where(eq(generatedImages.taskId, payload.task_id));

        // Confirmar créditos se houver uma reserva pendente
        if (imageRecord?.reservationId) {
          try {
            const result = await confirmCreditsWebhook({
              userId: imageRecord.userId,
              reservationId: imageRecord.reservationId,
              modelId: imageRecord.model,
              imageId: imageRecord.id,
              description: `Geração de imagem via webhook - ${imageRecord.model}`,
            });

            if (result?.data?.success) {
              console.log(
                `✅ Credits confirmed via webhook for task: ${payload.task_id}`
              );
            } else {
              console.error(
                `❌ Error confirming credits via webhook for task ${payload.task_id}:`,
                result?.data?.errors
              );
            }
          } catch (creditError) {
            console.error(
              `❌ Error confirming credits via webhook for task ${payload.task_id}:`,
              creditError
            );
            // Não falhar o webhook por erro de créditos
          }
        }
      } catch (dbError) {
        console.error(
          `❌ Error processing webhook for task ${payload.task_id}:`,
          dbError
        );
      }
      return NextResponse.json({ success: true });
    } else if (mappedStatus === "Error") {
      // Cancelar reserva em caso de falha via webhook
      try {
        const [imageRecord] = await db
          .select()
          .from(generatedImages)
          .where(eq(generatedImages.taskId, payload.task_id));

        if (imageRecord?.reservationId) {
          try {
            const result = await cancelReservationWebhook({
              userId: imageRecord.userId,
              reservationId: imageRecord.reservationId,
              reason: `Falha na geração da imagem - Task: ${payload.task_id}`,
            });

            if (result?.data?.success) {
              console.log(
                `✅ Reservation cancelled via webhook for failed task: ${payload.task_id}`
              );
            } else {
              console.error(
                `❌ Error cancelling reservation via webhook for task ${payload.task_id}:`,
                result?.data?.errors
              );
            }
          } catch (creditError) {
            console.error(
              `❌ Error cancelling reservation via webhook for task ${payload.task_id}:`,
              creditError
            );
          }
        }

        // Atualizar status para erro
        await db
          .update(generatedImages)
          .set({ status: "error" })
          .where(eq(generatedImages.taskId, payload.task_id));
      } catch (dbError) {
        console.error(
          `❌ Error processing failed webhook for task ${payload.task_id}:`,
          dbError
        );
      }
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Endpoint para verificar o status de uma tarefa
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ error: "Task ID required" }, { status: 400 });
  }
  const result = webhookResults.get(taskId);
  if (!result) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json(result);
}
