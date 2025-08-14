"use server";

import { authActionClient } from "@/lib/safe-action";
import { generateImageSchema } from "./generate-image.action.schema";
import { db } from "@/db";
import { generatedImages, modelCosts } from "@/db/schema";
import { reserveCredits } from "@/actions/credits/reserve/reserve-credits.action";
import { confirmCredits } from "@/actions/credits/confirm/confirm-credits.action";
import { cancelReservation } from "@/actions/credits";
import { spendFreeCredits } from "@/actions/credits/spend/spend-free-credits.action";
import { getUserFreeCredits } from "@/actions/credits/get/get-user-free-credits.action";
import { eq, and } from "drizzle-orm";
import { subscriptions } from "@/db/schema";
import { randomUUID } from "crypto";
import { spawn } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { validateBFLDimensions } from "@/lib/utils";
import Together from "together-ai";

// Função para fazer requisição usando curl (que sabemos que funciona)
async function makeCurlRequest(
  url: string,
  headers: Record<string, string>,
  body: string
): Promise<{ status: number; data: any; statusText: string }> {
  return new Promise((resolve, reject) => {
    // Criar arquivo temporário para o corpo da requisição
    const tempFile = join(tmpdir(), `curl-body-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.json`);
    
    try {
      writeFileSync(tempFile, body, 'utf8');
    } catch (error) {
      reject(new Error(`Erro ao criar arquivo temporário: ${error}`));
      return;
    }

    const curlArgs = [
      "-4", // Forçar IPv4
      "-X",
      "POST",
      url,
      "--connect-timeout",
      "60",
      "--max-time",
      "120",
      "-H",
      "Content-Type: application/json",
      "--data-binary",
      `@${tempFile}`,
    ];

    // Adicionar headers
    Object.entries(headers).forEach(([key, value]) => {
      curlArgs.push("-H", `${key}: ${value}`);
    });

    curlArgs.push("-w", "%{http_code}"); // Adicionar código de status
    curlArgs.push("-s"); // Silent mode

    console.log("Executando curl:", curlArgs.join(" "));

    const curl = spawn("curl", curlArgs);
    let stdout = "";
    let stderr = "";

    curl.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    curl.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    curl.on("close", (code) => {
      // Limpar arquivo temporário
      try {
        unlinkSync(tempFile);
      } catch (error) {
        console.warn(`Erro ao remover arquivo temporário: ${error}`);
      }

      if (code !== 0) {
        reject(new Error(`Curl failed with code ${code}: ${stderr}`));
        return;
      }

      try {
        // O último número é o status code
        const statusMatch = stdout.match(/(\d{3})$/);
        const status = statusMatch ? parseInt(statusMatch[1]) : 0;

        // Remover o status code do final
        const responseBody = stdout.replace(/(\d{3})$/, "");

        let data;
        try {
          data = JSON.parse(responseBody);
        } catch {
          data = responseBody;
        }

        resolve({
          status,
          data,
          statusText: status >= 200 && status < 300 ? "OK" : "Error",
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Função para gerar imagens usando Together.ai (específico para flux-schnell)
async function generateImageWithTogether(
  prompt: string,
  steps: number = 10,
  n: number = 1
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    // Verificar se a API key está configurada
    if (!process.env.TOGETHER_API_KEY) {
      console.error('TOGETHER_API_KEY não está configurada');
      return {
        success: false,
        error: "Chave da API Together.ai não configurada",
      };
    }

    const together = new Together({
      apiKey: process.env.TOGETHER_API_KEY,
    });

    console.log('Gerando imagem com Together.ai:', {
      model: 'black-forest-labs/FLUX.1-schnell-Free',
      prompt,
      steps,
      n,
      apiKeyConfigured: !!process.env.TOGETHER_API_KEY
    });

    const response = await together.images.create({
      model: "black-forest-labs/FLUX.1-schnell-Free",
      prompt,
      steps,
      n,
    });

    const responseData = response.data[0];
        console.log("Resposta da Together.ai recebida:", {
          success: !!responseData,
          hasUrl: !!(responseData as any)?.url,
          hasB64: !!(responseData as any)?.b64_json,
          responseKeys: Object.keys(responseData || {})
        });

    if (response.data && response.data.length > 0) {
      const imageData = response.data[0];
      
      // Verificar se é base64 ou URL
      let imageUrl: string;
      if ('b64_json' in imageData && imageData.b64_json) {
        // Converter base64 para data URL
        imageUrl = `data:image/png;base64,${imageData.b64_json}`;
      } else if ('url' in imageData && imageData.url) {
        // Usar URL diretamente
        imageUrl = imageData.url;
      } else {
        return {
          success: false,
          error: "Formato de resposta inválido da API Together.ai",
        };
      }
      
      return {
        success: true,
        imageUrl,
      };
    }

    return {
      success: false,
      error: "Nenhuma imagem foi gerada pela Together.ai",
    };
  } catch (error) {
    console.error('Erro ao gerar imagem com Together.ai:', error);
    
    // Extrair mensagem de erro mais específica
    let errorMessage = "Erro desconhecido";
    if (error instanceof Error) {
      errorMessage = error.message;
      // Se for um erro da API, tentar extrair a mensagem específica
      if (error.message.includes('400') && error.message.includes('steps')) {
        errorMessage = "Steps deve estar entre 1 e 4 para o modelo FLUX.1-schnell-Free";
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
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
        inputImage,
        aspectRatio = "1:1",
        width,
        height,
        seed,
        steps,
        guidance,
        isPublic = false,
        promptUpsampling = false,
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

      // Verificar se o usuário tem assinatura ativa
      const activeSubscription = await db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active')
        ),
      });

      // Verificar créditos baseado no modelo
      let reservationId: string | null = null;
      let usesFreeCredits = false;
      const hasActiveSubscription = !!activeSubscription;
      
      if (model === "flux-schnell") {
        // Se tem assinatura ativa, flux-schnell é ilimitado (não cobra créditos)
        if (hasActiveSubscription) {
          usesFreeCredits = false; // Não usa créditos gratuitos nem pagos
        } else {
          // Para usuários sem assinatura, verificar créditos gratuitos
          const freeCreditsResult = await getUserFreeCredits({});
          
          if (freeCreditsResult.serverError || !freeCreditsResult.data?.success) {
            return {
              error: "Erro ao verificar créditos gratuitos",
            };
          }
          
          const freeCreditsData = freeCreditsResult.data.data;
          if (!freeCreditsData || freeCreditsData.freeCreditsBalance <= 0) {
            return {
              error: "Créditos gratuitos insuficientes para usar este modelo",
            };
          }
          
          usesFreeCredits = true;
        }
      } else {
        // Para outros modelos, usar sistema de reserva normal
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
      }

      // Se for flux-schnell, usar Together.ai
      if (model === "flux-schnell") {
        console.log('Usando Together.ai para flux-schnell');
        
        const togetherResult = await generateImageWithTogether(
          prompt,
          Math.min(steps || 4, 4), // Together.ai aceita apenas steps entre 1 e 4
          1
        );

        if (togetherResult.success && togetherResult.imageUrl) {
          // Salvar no banco de dados com URL original da Together.ai (sem upload S3)
          const taskId = randomUUID();
          const imageId = randomUUID();
          
          // Confirmar créditos baseado no tipo
          if (usesFreeCredits) {
            // Para flux-schnell sem assinatura, gastar créditos gratuitos
            const spendResult = await spendFreeCredits({
              modelId: model,
              description: `Geração de imagem concluída via Together.ai - ${model}`,
            });

            if (spendResult.serverError || !spendResult.data?.success) {
              console.error(
                "Erro ao gastar créditos gratuitos:",
                spendResult.data?.errors || spendResult.serverError
              );
            }
          } else if (reservationId) {
            // Para outros modelos, confirmar reserva
            const confirmResult = await confirmCredits({
              reservationId: reservationId,
              modelId: model,
              imageId: imageId,
              description: `Geração de imagem concluída via Together.ai - ${model}`,
            });

            if (confirmResult.serverError || !confirmResult.data?.success) {
              console.error(
                "Erro ao confirmar créditos:",
                confirmResult.data?.errors || confirmResult.serverError
              );
            }
          }

          console.log('Salvando imagem no banco com URL original da Together.ai:', {
            imageId,
            taskId,
            userId,
            imageUrl: togetherResult.imageUrl
          });
          
          try {
            await db.insert(generatedImages).values({
              id: imageId,
              userId,
              taskId: taskId,
              prompt,
              model,
              aspectRatio,
              seed: seed || null,
              steps: steps || null,
              guidance: guidance ? guidance.toString() : null,
              status: "completed",
              imageUrl: togetherResult.imageUrl, // URL original da Together.ai
              creditsUsed: modelCost.credits,
              reservationId: reservationId,
              completedAt: new Date(),
              generationTimeMs: 0, // Together.ai é instantâneo
              isPublic: isPublic,
            });
          } catch (dbError) {
            console.error("Erro ao salvar no banco:", dbError);
          }

          return {
            success: true,
            imageUrl: togetherResult.imageUrl,
            taskId: taskId,
            imageId: imageId,
          };
        } else {
          // Se falhou com Together.ai, cancelar reserva apenas se não for créditos gratuitos
          if (!usesFreeCredits && reservationId) {
            await cancelReservation({
              reservationId: reservationId,
              reason: `Falha na geração via Together.ai - ${togetherResult.error}`,
              userId: "",
            });
          }
          
          return {
            success: false,
            error: togetherResult.error || "Falha ao gerar imagem via Together.ai",
          };
        }
      }

      // Para outros modelos, continuar com BFL API
      // Preparar parâmetros da requisição
      const requestBody: any = {
        prompt,
        aspect_ratio: convertAspectRatio(aspectRatio),
        output_format: "jpeg",
        safety_tolerance: 2,
        prompt_upsampling: promptUpsampling,
      };

      // Adicionar dimensões customizadas se fornecidas
      if (width && height) {
        const { width: validWidth, height: validHeight } =
          validateBFLDimensions(width, height);

        console.log(`Dimensões originais: ${width}x${height}`);
        console.log(`Dimensões ajustadas: ${validWidth}x${validHeight}`);

        requestBody.width = validWidth;
        requestBody.height = validHeight;
        delete requestBody.aspect_ratio;
      }

      // Adicionar parâmetros específicos do modelo
      if (seed !== undefined && seed >= 0) {
        // Garantir que o seed seja um inteiro válido
        const validSeed = Math.floor(Math.abs(seed));
        requestBody.seed = validSeed;
        console.log(`Seed definido como: ${validSeed}`);
      }

      if (steps !== undefined && ["flux-dev", "flux-pro"].includes(model)) {
        // Flux-dev: steps entre 1-50, padrão 28 (baseado na documentação oficial)
        const validSteps = Math.max(1, Math.min(50, steps));
        requestBody.steps = validSteps;
        console.log(`Steps ajustado de ${steps} para ${validSteps}`);
      }

      if (guidance !== undefined && ["flux-dev", "flux-pro"].includes(model)) {
        // Flux-dev: guidance entre 2-10, padrão 3 (baseado na documentação oficial)
        const validGuidance = Math.max(2, Math.min(10, guidance));
        requestBody.guidance = validGuidance;
        console.log(`Guidance ajustado de ${guidance} para ${validGuidance}`);
      }

      // Configurar webhook
      const webhookUrl = `${process.env.WEBHOOK_URL}`;
      requestBody.webhook_url = webhookUrl;

      // Verificar se o prompt não está vazio
      if (!requestBody.prompt || requestBody.prompt.trim().length === 0) {
        throw new Error("Prompt não pode estar vazio");
      }

      // Verificar se o webhook está configurado
      if (!requestBody.webhook_url) {
        throw new Error("Webhook URL não configurado");
      }

      // Adicionar imagem de entrada baseado no modelo
      if (inputImage) {
        // Remover o prefixo data:image/... se presente, pois a API BFL espera apenas o base64 puro
        const base64Data = inputImage.includes(',') ? inputImage.split(',')[1] : inputImage;
        
        if (model === "flux-kontext-pro") {
          // Para flux-kontext-pro, usar input_image
          requestBody.input_image = base64Data;
        } else {
          // Para outros modelos (flux-pro, flux-dev, etc.), usar image_prompt
          requestBody.image_prompt = base64Data;
        }
      }

      // Função para fazer requisição com retry e backoff exponencial usando curl
      const makeRequestWithRetry = async (
        maxRetries = 5
      ): Promise<{ status: number; data: any; statusText: string }> => {
        const requestUrl = `${BFL_BASE_URL}${endpoint}`;

        console.log(`Iniciando requisição para BFL API: ${requestUrl}`);
        console.log(`Request body:`, JSON.stringify(requestBody, null, 2));

        const headers = {
          "x-key": BFL_API_KEY,
          accept: "application/json",
          "User-Agent": "Pixoo/1.0",
          Connection: "close",
        };

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          console.log(`Tentativa ${attempt}/${maxRetries}`);

          try {
            const createResponse = await makeCurlRequest(
              requestUrl,
              headers,
              JSON.stringify(requestBody)
            );

            console.log("Resposta recebida da BFL API via curl");

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
              // Log detalhado para erros 4xx (especialmente 422)
              if (createResponse.status >= 400 && createResponse.status < 500) {
                console.error("Erro 4xx da BFL API:", {
                  status: createResponse.status,
                  statusText: createResponse.statusText,
                  responseBody: createResponse.data,
                  requestBody: requestBody,
                });
              }

              throw new Error(
                `Falha ao criar requisição: ${createResponse.statusText} (${
                  createResponse.status
                }). Resposta: ${JSON.stringify(createResponse.data)}`
              );
            }

            return createResponse;
          } catch (error) {
            console.error(`Erro na tentativa ${attempt}:`, error);

            // Se for erro de timeout ou conectividade, tenta novamente
            if (
              error instanceof Error &&
              (error.message.includes("timeout") ||
                error.message.includes("ConnectTimeoutError") ||
                error.message.includes("Curl failed") ||
                error.message.includes("fetch failed"))
            ) {
              if (attempt < maxRetries) {
                const waitTime = Math.min(Math.pow(2, attempt) * 2000, 10000); // Max 10s
                console.log(
                  `Aguardando ${waitTime}ms antes da próxima tentativa...`
                );
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
            isPublic: isPublic,
          });
        } catch (dbError) {
          console.error("Erro ao salvar no banco:", dbError);
          // Se falhar ao salvar no banco e há reserva, cancelar a reserva (não reembolsar pois não foi cobrado)
          if (!usesFreeCredits && reservationId) {
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
            success: false,
            error: "Erro interno ao salvar dados",
          };
        }

        return {
          success: true,
          taskId: createData.id,
          status: "Pending",
          message: "Geração de imagem iniciada com webhook.",
        };
      }

      return {
        success: false,
        error: "Formato de resposta inesperado da API BFL",
      };
    } catch (error) {
      console.error("Erro na geração de imagem:", error);
      return {
        success: false,
        error: "Falha ao gerar imagem. Tente novamente.",
      };
    }
  });
