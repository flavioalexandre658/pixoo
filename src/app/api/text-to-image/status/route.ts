import { NextRequest, NextResponse } from "next/server";
import { activeConnections } from "../sse-utils";

// Endpoint para Server-Sent Events
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Armazenar a conexão
      activeConnections.set(taskId, controller);
      
      // Enviar mensagem inicial
      controller.enqueue(`data: ${JSON.stringify({ status: 'connected', taskId })}\n\n`);
      
      // Cleanup quando a conexão for fechada
      request.signal.addEventListener('abort', () => {
        activeConnections.delete(taskId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}