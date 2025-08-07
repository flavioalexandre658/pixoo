import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CreditsService } from "@/services/credits/credits.service";
import { z } from "zod";

const earnCreditsSchema = z.object({
  amount: z.number().positive("Quantidade deve ser positiva"),
  description: z.string().min(1, "Descrição é obrigatória"),
  type: z.enum(["earned", "bonus", "refund"]).default("earned"),
  relatedImageId: z.string().optional(),
});

// POST /api/credits/earn - Adicionar créditos
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = earnCreditsSchema.parse(body);

    const { amount, description, type, relatedImageId } = validatedData;

    await CreditsService.earnCredits({
      userId: session.user.id,
      amount,
      description,
      type,
      relatedImageId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao adicionar créditos:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
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