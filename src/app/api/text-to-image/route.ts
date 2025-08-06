import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db";
import { generatedImages } from "../../../../db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CreditsService } from "@/services/credits/credits.service";
import { CreditsMiddleware } from "@/lib/credits-middleware";

const BFL_API_KEY = "42dbe2e7-b294-49af-89e4-3ef00d616cc5";
const BFL_BASE_URL = "https://api.bfl.ai/v1";

// Mapeamento dos modelos para os endpoints da BFL
const MODEL_ENDPOINTS = {
  "flux-schnell": "/flux-schnell",
  "flux-dev": "/flux-dev",
  "flux-pro": "/flux-pro",
  "flux-pro-1.1": "/flux-pro-1.1",
  "flux-pro-1.1-ultra": "/flux-pro-1.1-ultra",
  "flux-realism": "/flux-pro", // Flux Realism usa o endpoint pro
  "flux-kontext-pro": "/flux-kontext-pro",
};

interface TextToImageRequest {
  prompt: string;
  model: string;
  aspectRatio?: string;
  width?: number;
  height?: number;
  seed?: number;
  steps?: number;
  guidance?: number;
  imagePublic?: boolean;
}

// Função para converter aspect ratio para o formato da BFL
function convertAspectRatio(ratio: string): string {
  const ratioMap: { [key: string]: string } = {
    "1:1": "1:1",
    "16:9": "16:9",
    "9:16": "9:16",
    "4:3": "4:3",
    "3:4": "3:4",
    "21:9": "21:9",
  };
  return ratioMap[ratio] || "1:1";
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: TextToImageRequest = await request.json();
    const { prompt, model, aspectRatio = "1:1", width, height, seed, steps, guidance } = body;

    console.log("📐 Received dimensions:", { width, height, aspectRatio });

    if (!prompt || !model) {
      return NextResponse.json(
        { error: "Prompt and model are required" },
        { status: 400 }
      );
    }

    // Verifica se o modelo é suportado
    const endpoint = MODEL_ENDPOINTS[model as keyof typeof MODEL_ENDPOINTS];
    if (!endpoint) {
      return NextResponse.json(
        { error: `Unsupported model: ${model}` },
        { status: 400 }
      );
    }

    // Verificar custo do modelo e créditos do usuário
    const modelCost = await CreditsService.getModelCost(model);
    if (!modelCost) {
      return NextResponse.json(
        { error: `Modelo ${model} não encontrado no sistema de créditos` },
        { status: 400 }
      );
    }

    // Garantir que o usuário tem créditos iniciais e verificar se tem créditos suficientes
    if (modelCost.credits > 0) {
      await CreditsMiddleware.ensureUserCredits(session.user.id);
      
      const creditsValidation = await CreditsMiddleware.validateCredits(session.user.id, modelCost.credits);
      if (!creditsValidation.valid) {
        return NextResponse.json(
          { error: creditsValidation.message },
          { status: 402 }
        );
      }
    }

    // Prepara os parâmetros da requisição baseado no modelo
    const requestBody: any = {
      prompt,
      aspect_ratio: convertAspectRatio(aspectRatio),
      output_format: "jpeg",
      safety_tolerance: 2,
      prompt_upsampling: false,
    };

    // Adiciona dimensões customizadas se fornecidas
    if (width !== undefined && height !== undefined) {
      requestBody.width = width;
      requestBody.height = height;
      console.log("✅ Added custom dimensions to request:", { width, height });
    } else {
      console.log("⚠️ No custom dimensions provided, using aspect_ratio only:", aspectRatio);
    }

    // Adiciona parâmetros opcionais se fornecidos
    if (seed !== undefined) {
      requestBody.seed = seed;
    }

    // Para modelos que suportam steps e guidance (exceto flux-schnell e flux-kontext-pro)
    if (model !== "flux-schnell" && model !== "flux-kontext-pro") {
      if (steps !== undefined) {
        requestBody.steps = steps;
      }
      if (guidance !== undefined) {
        requestBody.guidance_scale = guidance;
      }
    }

    // Adicionar webhook URL e secret
    // IMPORTANTE: Para desenvolvimento local, você precisa usar ngrok ou similar
    // para expor o webhook publicamente, pois a BFL não consegue acessar localhost
    const webhookUrl =
      process.env.WEBHOOK_URL || `${request.nextUrl.origin}/api/webhook/bfl`;
    const webhookSecret = process.env.BFL_WEBHOOK_SECRET || "default-secret";
    requestBody.webhook_url = webhookUrl;
    requestBody.webhook_secret = webhookSecret;

    console.log("Sending request to BFL:", {
      endpoint: `${BFL_BASE_URL}${endpoint}`,
      model,
      prompt: prompt.substring(0, 100) + "...",
      webhookUrl,
      requestBody,
    });

    // Função para fazer requisição com retry e backoff exponencial
    const makeRequestWithRetry = async (
      maxRetries = 3
    ): Promise<Response | NextResponse> => {
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

          console.log(
            `BFL API Response Status (attempt ${attempt}):`,
            createResponse.status
          );

          if (createResponse.status === 402) {
            return NextResponse.json(
              {
                error:
                  "Insufficient credits. Please add more credits to your BFL account.",
              },
              { status: 402 }
            );
          }

          if (createResponse.status === 429) {
            return NextResponse.json(
              { error: "Rate limit exceeded. Please try again later." },
              { status: 429 }
            );
          }

          // Retry em caso de erro 502/503/504 (servidor temporariamente indisponível)
          if (
            (createResponse.status === 502 ||
              createResponse.status === 503 ||
              createResponse.status === 504) &&
            attempt < maxRetries
          ) {
            const waitTime = Math.pow(2, attempt) * 1000; // Backoff exponencial
            console.log(
              `Server temporarily unavailable (${createResponse.status}). Retrying in ${waitTime}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }

          if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.error("BFL API Error:", {
              status: createResponse.status,
              statusText: createResponse.statusText,
              body: errorText,
            });

            throw new Error(
              `Failed to create request: ${createResponse.statusText}`
            );
          }

          return createResponse;
        } catch (error) {
          if (attempt === maxRetries) {
            throw error;
          }
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(
            `Request failed (attempt ${attempt}). Retrying in ${waitTime}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }

      // Fallback se todas as tentativas falharam
      throw new Error("All retry attempts failed");
    };

    const createResponse = await makeRequestWithRetry();
    if (createResponse instanceof NextResponse) {
      return createResponse; // Retorna erro direto se for 402 ou 429
    }

    // Garantir que createResponse é uma Response válida
    if (!(createResponse instanceof Response)) {
      throw new Error("Invalid response received");
    }

    const createData = await createResponse.json();
    console.log("BFL Response:", createData);

    // Se a resposta já contém o resultado (para modelos rápidos como flux-schnell)
    if (createData.result && createData.result.sample) {
      return NextResponse.json({
        success: true,
        imageUrl: createData.result.sample,
        taskId: createData.id,
      });
    }

    // Para modelos que requerem polling, retornar taskId e webhook URL
    if (createData.id) {
      console.log(
        "Task created, use polling to check status...",
        createData.id
      );

      // Salvar dados iniciais no banco
      try {
        await db.insert(generatedImages).values({
          id: crypto.randomUUID(),
          userId: session.user.id,
          taskId: createData.id,
          prompt,
          model,
          aspectRatio,
          seed: seed || null,
          steps: steps || null,
          guidance: guidance ? guidance.toString() : null,
          status: "pending",
          creditsUsed: modelCost.credits,
        });
      } catch (dbError) {
        console.error("Error saving to database:", dbError);
        // Continuar mesmo se houver erro no banco
      }

      return NextResponse.json({
        taskId: createData.id,
        status: "Pending",
        message: "Image generation started with webhook.",
      });
    }

    return NextResponse.json(
      { error: "Unexpected response format from BFL API" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error in text-to-image API:", error);
    return NextResponse.json(
      { error: "Failed to generate image. Please try again." },
      { status: 500 }
    );
  }
}
