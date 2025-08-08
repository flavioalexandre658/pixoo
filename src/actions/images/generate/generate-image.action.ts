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
      if (seed !== undefined) {
        requestBody.seed = seed;
      }

      if (steps !== undefined && ["flux-dev", "flux-pro"].includes(model)) {
        requestBody.steps = steps;
      }

      if (guidance !== undefined && ["flux-dev", "flux-pro"].includes(model)) {
        requestBody.guidance = guidance;
      }

      // Configurar webhook
      const webhookUrl = `${process.env.WEBHOOK_URL}`;
      requestBody.webhook_url = webhookUrl;

      // Função para fazer requisição com retry e backoff exponencial
      const makeRequestWithRetry = async (
        maxRetries = 3
      ): Promise<Response> => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const createResponse = await fetch(`${BFL_BASE_URL}${endpoint}`, {
              method: "POST",
              headers: {
                "x-key": BFL_API_KEY,
                "Content-Type": "application/json",
                accept: "application/json",
              },
              body: JSON.stringify(requestBody),
            });

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

            if (!createResponse.ok) {
              throw new Error(
                `Falha ao criar requisição: ${createResponse.statusText}`
              );
            }

            return createResponse;
          } catch (error) {
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
      const createData = await createResponse.json();
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
