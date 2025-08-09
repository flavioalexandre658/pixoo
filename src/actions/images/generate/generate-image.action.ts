"use server";

import { authActionClient } from "@/lib/safe-action";
import { generateImageSchema } from "./generate-image.action.schema";
import { db } from "@/db";
import { generatedImages, modelCosts } from "@/db/schema";
import { reserveCredits } from "@/actions/credits/reserve/reserve-credits.action";
import { confirmCredits } from "@/actions/credits/confirm/confirm-credits.action";
import { cancelReservation } from "@/actions/credits";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { spawn } from "child_process";
import { promisify } from "util";

// Função para fazer requisição usando curl (que sabemos que funciona)
async function makeCurlRequest(url: string, headers: Record<string, string>, body: string): Promise<{ status: number; data: any; statusText: string }> {
  return new Promise((resolve, reject) => {
    const curlArgs = [
      '-4', // Forçar IPv4
      '-X', 'POST',
      url,
      '--connect-timeout', '60',
      '--max-time', '120',
      '-H', 'Content-Type: application/json',
      '-d', body
    ];
    
    // Adicionar headers
    Object.entries(headers).forEach(([key, value]) => {
      curlArgs.push('-H', `${key}: ${value}`);
    });
    
    curlArgs.push('-w', '%{http_code}'); // Adicionar código de status
    curlArgs.push('-s'); // Silent mode
    
    console.log('Executando curl:', curlArgs.join(' '));
    
    const curl = spawn('curl', curlArgs);
    let stdout = '';
    let stderr = '';
    
    curl.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    curl.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    curl.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Curl failed with code ${code}: ${stderr}`));
        return;
      }
      
      try {
        // O último número é o status code
        const statusMatch = stdout.match(/(\d{3})$/);
        const status = statusMatch ? parseInt(statusMatch[1]) : 0;
        
        // Remover o status code do final
        const responseBody = stdout.replace(/(\d{3})$/, '');
        
        let data;
        try {
          data = JSON.parse(responseBody);
        } catch {
          data = responseBody;
        }
        
        resolve({
          status,
          data,
          statusText: status >= 200 && status < 300 ? 'OK' : 'Error'
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}


const BFL_API_KEY = "42dbe2e7-b294-49af-89e4-3ef00d616cc5";
const BFL_BASE_URL = "https://api.bfl.ai/v1";

const MODEL_ENDPOINTS = {
  "flux-schnell": "/flux-schnell",
  "flux-dev": "/flux-dev",
  "flux-pro": "/flux-pro",
  "flux-pro-1.1": "/flux-pro-1.1",
  "flux-pro-1.1-ultra": "/flux-pro-1.1-ultra",
  "flux-realism": "/flux-pro", // Flux Realism usa o endpoint pro
  "flux-kontext-pro": "/flux-kontext-pro",
};

function convertAspectRatio(ratio: string): string {
  const aspectRatioMap: { [key: string]: string } = {
    "1:1": "1:1",
    "16:9": "16:9",
    "9:16": "9:16",
    "4:3": "4:3",
    "3:4": "3:4",
    "21:9": "21:9",
    "9:21": "9:21",
  };
  return aspectRatioMap[ratio] || "1:1";
}

export const generateImage = authActionClient
  .inputSchema(generateImageSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const {
        prompt,
        model,
        aspectRatio = "1:1",
        width,
        height,
        seed,
        steps,
        guidance,
      } = parsedInput;

      const { userId } = ctx as { userId: string };

      // Verificar se o modelo é suportado
      const endpoint = MODEL_ENDPOINTS[model as keyof typeof MODEL_ENDPOINTS];
      if (!endpoint) {
        return {
          error: "Modelo não suportado",
        };
      }

      // Buscar informações do modelo dinamicamente
      const [modelCost] = await db
        .select()
        .from(modelCosts)
        .where(eq(modelCosts.modelId, model))
        .limit(1);

      if (!modelCost) {
        return {
          error: "Modelo não encontrado",
        };
      }

      // Reservar créditos
      let reservationId: string | null = null;
      const reserveResult = await reserveCredits({
        modelId: model,
        description: `Reserva para geração de imagem - ${model}`,
      });

      if (reserveResult.serverError || !reserveResult.data?.success) {
        return {
          error:
            reserveResult.data?.errors?._form?.[0] ||
            reserveResult.serverError ||
            "Erro ao reservar créditos",
        };
      }

      reservationId = reserveResult.data?.data?.reservationId || null;

      // Preparar parâmetros da requisição
      const requestBody: any = {
        prompt,
        aspect_ratio: convertAspectRatio(aspectRatio),
        output_format: "jpeg",
        safety_tolerance: 2,
        prompt_upsampling: false,
      };

      // Adicionar dimensões customizadas se fornecidas
      if (width && height) {
        requestBody.width = width;
        requestBody.height = height;
        delete requestBody.aspect_ratio;
      }

      // Adicionar parâmetros específicos do modelo
      if (seed !== undefined && seed >= 0) {
        requestBody.seed = seed;
      }

      if (steps !== undefined && ["flux-dev", "flux-pro"].includes(model)) {
        // Flux-dev: steps entre 1-50, padrão 28
        const validSteps = Math.max(1, Math.min(50, steps));
        requestBody.steps = validSteps;
      }

      if (guidance !== undefined && ["flux-dev", "flux-pro"].includes(model)) {
        // Flux-dev: guidance entre 1.5-10, padrão 3.5
        const validGuidance = Math.max(1.5, Math.min(10, guidance));
        requestBody.guidance = validGuidance;
      }

      // Configurar webhook
      const webhookUrl = `${process.env.WEBHOOK_URL}`;
      requestBody.webhook_url = webhookUrl;

      // Função para fazer requisição com retry e backoff exponencial usando curl
      const makeRequestWithRetry = async (
        maxRetries = 5
      ): Promise<{ status: number; data: any; statusText: string }> => {
        const requestUrl = `${BFL_BASE_URL}${endpoint}`;
        
        console.log(`Iniciando requisição para BFL API: ${requestUrl}`);
        console.log(`Request body:`, JSON.stringify(requestBody, null, 2));
        
        const headers = {
          "x-key": BFL_API_KEY,
          "accept": "application/json",
          "User-Agent": "Pixoo/1.0",
          "Connection": "close"
        };
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          console.log(`Tentativa ${attempt}/${maxRetries}`);

          try {
            const createResponse = await makeCurlRequest(
              requestUrl,
              headers,
              JSON.stringify(requestBody)
            );
            
            console.log('Resposta recebida da BFL API via curl');

            console.log(
              `BFL API Response Status (attempt ${attempt}):`,
              createResponse.status,
              createResponse.statusText
            );

            if (createResponse.status === 402) {
              throw new Error("Créditos insuficientes na conta BFL");
            }

            if (createResponse.status === 429) {
              throw new Error(
                "Limite de taxa excedido. Tente novamente mais tarde."
              );
            }

            // Retry em caso de erro 502/503/504
            if (
              (createResponse.status === 502 ||
                createResponse.status === 503 ||
                createResponse.status === 504) &&
              attempt < maxRetries
            ) {
              const waitTime = Math.pow(2, attempt) * 1000;
              await new Promise((resolve) => setTimeout(resolve, waitTime));
              continue;
            }

            if (createResponse.status < 200 || createResponse.status >= 300) {
              throw new Error(
                `Falha ao criar requisição: ${createResponse.statusText}`
              );
            }

            return createResponse;
          } catch (error) {
            console.error(`Erro na tentativa ${attempt}:`, error);
            
            // Se for erro de timeout ou conectividade, tenta novamente
            if (error instanceof Error && 
                (error.message.includes('timeout') ||
                 error.message.includes('ConnectTimeoutError') ||
                 error.message.includes('Curl failed') ||
                 error.message.includes('fetch failed'))) {
              
              if (attempt < maxRetries) {
                const waitTime = Math.min(Math.pow(2, attempt) * 2000, 10000); // Max 10s
                console.log(`Aguardando ${waitTime}ms antes da próxima tentativa...`);
                await new Promise((resolve) => setTimeout(resolve, waitTime));
                continue;
              }
            }
            
            if (attempt === maxRetries) {
              throw error;
            }
            const waitTime = Math.pow(2, attempt) * 1000;
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          }
        }
        throw new Error("Todas as tentativas de retry falharam");
      };

      const createResponse = await makeRequestWithRetry();
      
      const createData = createResponse.data;
      // Se a resposta já contém o resultado (para modelos rápidos como flux-schnell)
      if (createData.result && createData.result.sample) {
        // Confirmar créditos se houve reserva
        if (reservationId) {
          const confirmResult = await confirmCredits({
            reservationId: reservationId,
            modelId: model,
            description: `Geração de imagem concluída - ${model}`,
          });

          if (confirmResult.serverError || !confirmResult.data?.success) {
            console.error(
              "Erro ao confirmar créditos:",
              confirmResult.data?.errors || confirmResult.serverError
            );
          }
        }

        return {
          success: true,
          imageUrl: createData.result.sample,
          taskId: createData.id,
        };
      }

      // Para modelos que requerem polling, retornar taskId
      if (createData.id) {
        // Salvar dados iniciais no banco
        try {
          await db.insert(generatedImages).values({
            id: randomUUID(),
            userId,
            taskId: createData.id,
            prompt,
            model,
            aspectRatio,
            seed: seed || null,
            steps: steps || null,
            guidance: guidance ? guidance.toString() : null,
            status: "pending",
            creditsUsed: modelCost.credits,
            reservationId: reservationId,
          });
        } catch (dbError) {
          console.error("Erro ao salvar no banco:", dbError);
          // Se falhar ao salvar no banco e há reserva, cancelar a reserva (não reembolsar pois não foi cobrado)
          if (reservationId) {
            const cancelResult = await cancelReservation({
              reservationId: reservationId,
              reason: `Erro ao salvar dados da imagem - ${model}`,
              userId: "",
            });

            if (cancelResult.serverError || !cancelResult.data?.success) {
              console.error(
                "Erro ao cancelar reserva:",
                cancelResult.data?.errors || cancelResult.serverError
              );
            }
          }
          return {
            error: "Erro interno ao salvar dados",
          };
        }

        return {
          taskId: createData.id,
          status: "Pending",
          message: "Geração de imagem iniciada com webhook.",
        };
      }

      return {
        error: "Formato de resposta inesperado da API BFL",
      };
    } catch (error) {
      console.error("Erro na geração de imagem:", error);
      return {
        error: "Falha ao gerar imagem. Tente novamente.",
      };
    }
  });
