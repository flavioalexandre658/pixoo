import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CreditsService } from "@/services/credits/credits.service";

// GET /api/credits - Obter créditos do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const creditsSummary = await CreditsService.getUserCreditsSummary(
      session.user.id
    );

    return NextResponse.json(creditsSummary);
  } catch (error) {
    console.error("Erro ao buscar créditos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}