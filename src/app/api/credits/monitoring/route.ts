import { NextRequest, NextResponse } from "next/server";
import { CreditsMonitoringService } from "@/services/credits/credits-monitoring.service";

/**
 * GET /api/credits/monitoring
 * Obtém métricas e informações de monitoramento do sistema de créditos
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "overview";
    const period = searchParams.get("period") as 'hour' | 'day' | 'week' | 'month' || "day";
    const limit = parseInt(searchParams.get("limit") || "10");

    switch (type) {
      case "overview":
      case "metrics":
        const systemMetrics = await CreditsMonitoringService.getSystemMetrics();
        return NextResponse.json({
          success: true,
          data: systemMetrics
        });

      case "health":
        const healthMetrics = await CreditsMonitoringService.getHealthMetrics();
        return NextResponse.json({
          success: true,
          data: healthMetrics
        });

      case "usage":
        const usageMetrics = await CreditsMonitoringService.getUsageMetrics(period);
        return NextResponse.json({
          success: true,
          data: usageMetrics
        });

      case "top-users":
        const topUsers = await CreditsMonitoringService.getTopUsers(limit);
        return NextResponse.json({
          success: true,
          data: topUsers
        });

      case "models":
        const modelStats = await CreditsMonitoringService.getModelUsageStats();
        return NextResponse.json({
          success: true,
          data: modelStats
        });

      case "dashboard":
        // Retorna dados completos para dashboard
        const [metrics, health, usage, users, models] = await Promise.all([
          CreditsMonitoringService.getSystemMetrics(),
          CreditsMonitoringService.getHealthMetrics(),
          CreditsMonitoringService.getUsageMetrics(period),
          CreditsMonitoringService.getTopUsers(5),
          CreditsMonitoringService.getModelUsageStats()
        ]);

        return NextResponse.json({
          success: true,
          data: {
            overview: metrics,
            health,
            usage,
            topUsers: users,
            models: models.slice(0, 10) // Top 10 modelos
          }
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Tipo de monitoramento inválido",
            validTypes: ["overview", "metrics", "health", "usage", "top-users", "models", "dashboard"]
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Erro ao obter métricas de monitoramento:", error);
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
 * POST /api/credits/monitoring
 * Executa ações de manutenção baseadas no monitoramento
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "health-check":
        const health = await CreditsMonitoringService.getHealthMetrics();
        
        // Se houver problemas críticos, retornar com status de erro
        if (health.status === 'critical') {
          return NextResponse.json(
            {
              success: false,
              error: "Sistema em estado crítico",
              data: health
            },
            { status: 503 } // Service Unavailable
          );
        }

        return NextResponse.json({
          success: true,
          message: `Sistema ${health.status === 'healthy' ? 'saudável' : 'com avisos'}`,
          data: health
        });

      case "generate-report":
        const [metrics, healthData, usage] = await Promise.all([
          CreditsMonitoringService.getSystemMetrics(),
          CreditsMonitoringService.getHealthMetrics(),
          CreditsMonitoringService.getUsageMetrics('day')
        ]);

        const report = {
          timestamp: new Date().toISOString(),
          summary: {
            totalUsers: metrics.users.total,
            totalBalance: metrics.users.totalBalance,
            systemHealth: healthData.status,
            issuesCount: healthData.issues.length
          },
          details: {
            metrics,
            health: healthData,
            usage
          }
        };

        return NextResponse.json({
          success: true,
          message: "Relatório gerado com sucesso",
          data: report
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Ação inválida",
            validActions: ["health-check", "generate-report"]
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Erro ao executar ação de monitoramento:", error);
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