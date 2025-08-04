import { NextRequest, NextResponse } from "next/server";
import { notifyTaskUpdate } from "../../text-to-image/sse-utils";
import { db } from "../../../../../db";
import { generatedImages } from "../../../../../db/schema";
import { eq } from "drizzle-orm";

// Interface para o payload do webhook da BFL
interface WebhookPayload {
  task_id: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
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
    console.log("Webhook BFL received:", {
      headers: Object.fromEntries(request.headers.entries()),
      url: request.url,
      method: request.method,
    });

    const body = await request.text();
    console.log("Webhook body:", body);

    const webhookSecret = request.headers.get("x-webhook-secret");

    // Verificar se o secret está presente
    if (!webhookSecret) {
      console.error("Webhook secret missing");
      return NextResponse.json(
        { error: "Webhook secret required" },
        { status: 401 }
      );
    }

    // Verificar a assinatura do webhook (opcional, mas recomendado)
    const expectedSecret = process.env.BFL_WEBHOOK_SECRET || "default-secret";
    if (webhookSecret !== expectedSecret) {
      console.error("Invalid webhook secret");
      return NextResponse.json(
        { error: "Invalid webhook secret" },
        { status: 401 }
      );
    }

    // Parse do payload
    const payload: WebhookPayload = JSON.parse(body);

    console.log("Webhook received:", {
      task_id: payload.task_id,
      status: payload.status,
      hasResult: !!payload.result,
      error: payload.error,
    });

    // Mapear status da BFL para nosso formato
    const mappedStatus =
      payload.status === "SUCCESS"
        ? "Ready"
        : payload.status === "FAILED"
        ? "Error"
        : payload.status === "PENDING"
        ? "Pending"
        : "Error";

    // Armazenar o resultado
    webhookResults.set(payload.task_id, payload);

    // Atualizar banco de dados
    try {
      const updateData: any = {
        status: mappedStatus.toLowerCase(),
        updatedAt: new Date().toISOString(),
      };

      if (payload.result?.sample) {
        updateData.imageUrl = payload.result.sample;
        updateData.completedAt = new Date().toISOString();

        // Calcular tempo de geração se disponível
        if (payload.result.start_time && payload.result.end_time) {
          updateData.generationTimeMs =
            (payload.result.end_time - payload.result.start_time) * 1000;
        } else if (payload.result.duration) {
          updateData.generationTimeMs = payload.result.duration * 1000;
        }
      }

      if (payload.error) {
        updateData.error = payload.error;
      }

      await db
        .update(generatedImages)
        .set(updateData)
        .where(eq(generatedImages.taskId, payload.task_id));

      console.log(`Database updated for task ${payload.task_id}`);
    } catch (dbError) {
      console.error("Error updating database:", dbError);
    }

    // Notificar o frontend via SSE
    notifyTaskUpdate(payload.task_id, {
      status: mappedStatus,
      imageUrl: payload.result?.sample,
      error: payload.error,
      progress: payload.progress,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
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
