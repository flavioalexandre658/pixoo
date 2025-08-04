import { NextRequest, NextResponse } from "next/server";
import { notifyTaskUpdate } from "../../text-to-image/sse-utils";

// Interface para o payload do webhook
interface WebhookPayload {
  id: string;
  status:
    | "Task not found"
    | "Pending"
    | "Request Moderated"
    | "Content Moderated"
    | "Ready"
    | "Error";
  result?: {
    sample: string; // URL da imagem gerada
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
      method: request.method
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
      id: payload.id,
      status: payload.status,
      hasResult: !!payload.result,
      error: payload.error,
    });

    // Armazenar o resultado
    webhookResults.set(payload.id, payload);

    // Notificar o frontend via SSE
    notifyTaskUpdate(payload.id, {
      status: payload.status,
      imageUrl: payload.result?.sample,
      error: payload.error,
      progress: payload.progress
    });

    // Em uma implementação real, você salvaria no banco de dados
    // await db.update(generations).set({
    //   status: payload.status,
    //   imageUrl: payload.result?.sample,
    //   error: payload.error,
    //   progress: payload.progress,
    //   updatedAt: new Date()
    // }).where(eq(generations.taskId, payload.id))

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

// Função helper para limpar resultados antigos (opcional)
export function cleanupOldResults() {
  // Implementar lógica para limpar resultados antigos
  // Por exemplo, remover resultados com mais de 1 hora
}
