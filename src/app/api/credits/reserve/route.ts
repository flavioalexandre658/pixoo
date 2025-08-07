import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { CreditsService } from "@/services/credits/credits.service";

const reserveCreditsSchema = z.object({
  modelId: z.string().min(1, "Model ID é obrigatório"),
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
    const validatedData = reserveCreditsSchema.parse(body);

    // Reservar créditos
    const reservation = await CreditsService.reserveCredits({
      userId: session.user.id,
      modelId: validatedData.modelId,
      description: validatedData.description,
    });

    return NextResponse.json({
      success: true,
      data: reservation,
      message: "Créditos reservados com sucesso",
    });
  } catch (error) {
    console.error("Erro ao reservar créditos:", error);

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