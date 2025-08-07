import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db";
import { generatedImages } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId parameter is required" },
        { status: 400 }
      );
    }

    // Buscar a imagem pelo taskId
    const [image] = await db
      .select()
      .from(generatedImages)
      .where(eq(generatedImages.taskId, taskId))
      .limit(1);

    if (!image) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    // Verificar se a imagem pertence ao usuário autenticado
    if (image.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json(image);
  } catch (error) {
    console.error("Error fetching image by taskId:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}