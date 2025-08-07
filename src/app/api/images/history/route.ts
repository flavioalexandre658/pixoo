import { NextResponse } from "next/server";
import { db } from "../../../../db";
import { generatedImages } from "../../../../db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Buscar imagens do usuário
    const images = await db
      .select()
      .from(generatedImages)
      .where(eq(generatedImages.userId, session.user.id))
      .orderBy(desc(generatedImages.createdAt))
      .limit(50); // Limitar a 50 imagens mais recentes

    return NextResponse.json(images);
  } catch (error) {
    console.error("Error fetching image history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
