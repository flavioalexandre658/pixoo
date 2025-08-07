import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { CreditsService } from "@/services/credits/credits.service";

const confirmCreditsSchema = z.object({
  reservationId: z.string().min(1, "Reservation ID é obrigatório"),
  modelId: z.string().min(1, "Model ID é obrigatório"),
  imageId: z.string().optional(),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Validar dados
    const body = await request.json();
    const validatedData = confirmCreditsSchema.parse(body);

    // Confirmar gasto de créditos
    await CreditsService.confirmSpendCredits({
      userId: session.user.id,
      modelId: validatedData.modelId,
      imageId: validatedData.imageId,
      description: validatedData.description,
      reservationId: validatedData.reservationId,
    });

    return NextResponse.json({
      success: true,
      message: "Créditos descontados com sucesso",
    });
  } catch (error) {
    console.error("Erro ao confirmar gasto de créditos:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}