import { NextRequest, NextResponse } from "next/server";
import { creditsAutoCleanup } from "@/lib/credits-auto-cleanup";

/**
 * GET /api/credits/auto-cleanup
 * Obtém status e estatísticas do sistema de limpeza automática
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "status":
        return NextResponse.json({
          success: true,
          data: creditsAutoCleanup.getStatus()
        });

      case "stats":
        const stats = await creditsAutoCleanup.getStats();
        return NextResponse.json({
          success: true,
          data: stats
        });

      default:
        // Retorna status e stats por padrão
        const [status, statsData] = await Promise.all([
          creditsAutoCleanup.getStatus(),
          creditsAutoCleanup.getStats()
        ]);

        return NextResponse.json({
          success: true,
          data: {
            status,
            stats: statsData
          }
        });
    }
  } catch (error) {
    console.error("Erro ao obter informações de limpeza automática:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/credits/auto-cleanup
 * Controla o sistema de limpeza automática
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "start":
        creditsAutoCleanup.start();
        return NextResponse.json({
          success: true,
          message: "Limpeza automática iniciada",
          data: creditsAutoCleanup.getStatus()
        });

      case "stop":
        creditsAutoCleanup.stop();
        return NextResponse.json({
          success: true,
          message: "Limpeza automática parada",
          data: creditsAutoCleanup.getStatus()
        });

      case "force":
        const result = await creditsAutoCleanup.forceCleanup();
        return NextResponse.json({
          success: true,
          message: "Limpeza forçada executada",
          data: result
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Ação inválida",
            validActions: ["start", "stop", "force"]
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Erro ao controlar limpeza automática:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}