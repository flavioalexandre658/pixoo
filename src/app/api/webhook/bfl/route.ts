import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../db";
import { generatedImages, creditReservations } from "../../../../../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { CreditsService } from "@/services/credits/credits.service";

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
  try {
    const body = await request.text();
    const webhookSecret = request.headers.get("x-webhook-secret");
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Webhook secret required" },
        { status: 401 }
      );
    }
    const expectedSecret = process.env.BFL_WEBHOOK_SECRET || "default-secret";
    if (webhookSecret !== expectedSecret) {
      return NextResponse.json(
        { error: "Invalid webhook secret" },
        { status: 401 }
      );
    }
    const payload: WebhookPayload = JSON.parse(body);
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
        // Buscar informações da imagem para confirmar créditos
        const [imageRecord] = await db
          .select()
          .from(generatedImages)
          .where(eq(generatedImages.taskId, payload.task_id));

        const updateData: any = {
          status: mappedStatus.toLowerCase(),
        };
        if (payload.result?.sample) {
          updateData.imageUrl = payload.result.sample;
          updateData.completedAt = new Date();
          if (payload.result.start_time && payload.result.end_time) {
            updateData.generationTimeMs = Math.round(
              (payload.result.end_time - payload.result.start_time) * 1000
            );
          } else if (payload.result.duration) {
            updateData.generationTimeMs = Math.round(
              payload.result.duration * 1000
            );
          }
        }
        
        // Atualizar registro da imagem
        await db
          .update(generatedImages)
          .set(updateData)
          .where(eq(generatedImages.taskId, payload.task_id));

        // Confirmar créditos se houver uma reserva pendente
        if (imageRecord?.reservationId) {
          try {
            await CreditsService.confirmSpendCredits({
              userId: imageRecord.userId,
              modelId: imageRecord.model,
              imageId: imageRecord.id,
              description: `Geração de imagem via webhook - ${imageRecord.model}`,
              reservationId: imageRecord.reservationId
            });
            console.log(`✅ Credits confirmed via webhook for task: ${payload.task_id}`);
          } catch (creditError) {
            console.error(`❌ Error confirming credits via webhook for task ${payload.task_id}:`, creditError);
            // Não falhar o webhook por erro de créditos
          }
        }
      } catch (dbError) {
        console.error(`❌ Error processing webhook for task ${payload.task_id}:`, dbError);
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
            await CreditsService.cancelReservation(imageRecord.reservationId);
            console.log(`✅ Reservation cancelled via webhook for failed task: ${payload.task_id}`);
          } catch (creditError) {
            console.error(`❌ Error cancelling reservation via webhook for task ${payload.task_id}:`, creditError);
          }
        }

        // Atualizar status para erro
        await db
          .update(generatedImages)
          .set({ status: "error" })
          .where(eq(generatedImages.taskId, payload.task_id));
      } catch (dbError) {
        console.error(`❌ Error processing failed webhook for task ${payload.task_id}:`, dbError);
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
