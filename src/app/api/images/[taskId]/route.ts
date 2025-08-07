import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db";
import { generatedImages } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Endpoint para buscar dados da imagem por taskId
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    // Buscar a imagem no banco de dados
    const [task] = await db
      .select()
      .from(generatedImages)
      .where(eq(generatedImages.taskId, taskId));

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Verificar se a imagem pertence ao usuário autenticado
    if (task.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      taskId: task.taskId,
      status: task.status,
      imageUrl: task.imageUrl,
      prompt: task.prompt,
      model: task.model,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
    });
  } catch (error) {
    console.error("Error fetching image data:", error);
    return NextResponse.json(
      { error: "Failed to fetch image data" },
      { status: 500 }
    );
  }
}