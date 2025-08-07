import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { CreditsService } from "@/services/credits/credits.service";

const refundCreditsSchema = z.object({
  amount: z.number().positive("Quantidade deve ser positiva"),
  description: z.string().min(1, "Descrição é obrigatória"),
  relatedImageId: z.string().optional(),
  originalTransactionId: z.string().optional(),
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
    const validatedData = refundCreditsSchema.parse(body);

    // Reembolsar créditos
    await CreditsService.refundCredits({
      userId: session.user.id,
      amount: validatedData.amount,
      description: validatedData.description,
      relatedImageId: validatedData.relatedImageId,
      originalTransactionId: validatedData.originalTransactionId,
    });

    return NextResponse.json({
      success: true,
      message: "Créditos reembolsados com sucesso",
    });
  } catch (error) {
    console.error("Erro ao reembolsar créditos:", error);

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