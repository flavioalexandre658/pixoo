import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CreditsCleanupService } from "@/services/credits/credits-cleanup.service";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação (apenas para admins ou sistema)
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const force = url.searchParams.get("force") === "true";

    let result;
    if (force) {
      // Forçar limpeza completa
      result = await CreditsCleanupService.fullCleanup();
    } else {
      // Limpeza condicional (respeitando throttling)
      const conditionalResult = await CreditsCleanupService.conditionalCleanup();
      if (!conditionalResult.executed) {
        return NextResponse.json({
          success: true,
          data: {
            executed: false,
            message: "Limpeza não executada - intervalo mínimo não atingido"
          }
        });
      }
      result = conditionalResult.result!;
    }
    
    return NextResponse.json({
      success: true,
      data: {
        executed: true,
        expiredReservationsCancelled: result.expired,
        oldReservationsDeleted: result.deleted,
        errors: result.errors,
        message: `Limpeza concluída: ${result.expired} expiradas canceladas, ${result.deleted} antigas deletadas${result.errors.length > 0 ? `, ${result.errors.length} erros` : ''}`
      }
    });
  } catch (error) {
    console.error("Erro na limpeza de reservas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificar reservas expiradas sem limpar
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    if (action === "stats") {
      // Obter estatísticas das reservas
      const stats = await CreditsCleanupService.getReservationStats();
      
      return NextResponse.json({
        success: true,
        data: {
          stats,
          message: `Estatísticas: ${stats.pending} pendentes, ${stats.confirmed} confirmadas, ${stats.cancelled} canceladas, ${stats.expired} expiradas`
        }
      });
    }

    if (action === "should-cleanup") {
      // Verificar se deve executar limpeza
      const shouldRun = CreditsCleanupService.shouldRunCleanup();
      
      return NextResponse.json({
        success: true,
        data: {
          shouldRunCleanup: shouldRun,
          message: shouldRun ? "Limpeza recomendada" : "Limpeza não necessária no momento"
        }
      });
    }

    return NextResponse.json(
      { error: "Ação não especificada. Use ?action=stats ou ?action=should-cleanup" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro ao verificar reservas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}