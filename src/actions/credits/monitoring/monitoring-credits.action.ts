'use server';

import { actionClient } from '@/lib/safe-action';
import { CreditsMonitoringService } from '@/services/credits/credits-monitoring.service';

import { monitoringCreditsGetSchema, monitoringCreditsPostSchema } from './monitoring-credits.action.schema';

/**
 * Action para obter métricas e informações de monitoramento do sistema de créditos
 */
export const getMonitoringData = actionClient
    .inputSchema(monitoringCreditsGetSchema)
    .action(async ({ parsedInput }) => {
        const { type, period, limit } = parsedInput;

        try {
            console.log(`🔄 Obtendo dados de monitoramento:`, {
                type,
                period,
                limit,
                timestamp: new Date().toISOString()
            });

            switch (type) {
                case "overview":
                case "metrics":
                    const systemMetrics = await CreditsMonitoringService.getSystemMetrics();
                    return {
                        success: true,
                        data: systemMetrics
                    };

                case "health":
                    const healthMetrics = await CreditsMonitoringService.getHealthMetrics();
                    return {
                        success: true,
                        data: healthMetrics
                    };

                case "usage":
                    const usageMetrics = await CreditsMonitoringService.getUsageMetrics(period);
                    return {
                        success: true,
                        data: usageMetrics
                    };

                case "top-users":
                    const topUsers = await CreditsMonitoringService.getTopUsers(limit);
                    return {
                        success: true,
                        data: topUsers
                    };

                case "models":
                    const modelStats = await CreditsMonitoringService.getModelUsageStats();
                    return {
                        success: true,
                        data: modelStats
                    };

                case "dashboard":
                    // Retorna dados completos para dashboard
                    const [metrics, health, usage, users, models] = await Promise.all([
                        CreditsMonitoringService.getSystemMetrics(),
                        CreditsMonitoringService.getHealthMetrics(),
                        CreditsMonitoringService.getUsageMetrics(period),
                        CreditsMonitoringService.getTopUsers(5),
                        CreditsMonitoringService.getModelUsageStats()
                    ]);

                    return {
                        success: true,
                        data: {
                            overview: metrics,
                            health,
                            usage,
                            topUsers: users,
                            models: models.slice(0, 10) // Top 10 modelos
                        }
                    };

                default:
                    return {
                        success: false,
                        errors: {
                            _form: ["Tipo de monitoramento inválido. Tipos válidos: overview, metrics, health, usage, top-users, models, dashboard"],
                        },
                    };
            }
        } catch (error) {
            console.error(`❌ Erro ao obter dados de monitoramento:`, {
                type,
                period,
                limit,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
            });
            return {
                success: false,
                errors: {
                    _form: [error instanceof Error ? error.message : 'Erro interno do servidor'],
                },
            };
        }
    });

/**
 * Action para executar ações de manutenção baseadas no monitoramento
 */
export const executeMonitoringAction = actionClient
    .inputSchema(monitoringCreditsPostSchema)
    .action(async ({ parsedInput }) => {
        const { action } = parsedInput;

        try {
            console.log(`🔄 Executando ação de monitoramento:`, {
                action,
                timestamp: new Date().toISOString()
            });

            switch (action) {
                case "health-check":
                    const health = await CreditsMonitoringService.getHealthMetrics();
                    
                    // Se houver problemas críticos, retornar com indicação de erro
                    if (health.status === 'critical') {
                        return {
                            success: false,
                            errors: {
                                _form: ["Sistema em estado crítico"],
                            },
                            data: health
                        };
                    }

                    return {
                        success: true,
                        data: {
                            message: `Sistema ${health.status === 'healthy' ? 'saudável' : 'com avisos'}`,
                            health
                        }
                    };

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

                    return {
                        success: true,
                        data: {
                            message: "Relatório gerado com sucesso",
                            report
                        }
                    };

                default:
                    return {
                        success: false,
                        errors: {
                            _form: ["Ação inválida. Ações válidas: health-check, generate-report"],
                        },
                    };
            }
        } catch (error) {
            console.error(`❌ Erro ao executar ação de monitoramento:`, {
                action,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
            });
            return {
                success: false,
                errors: {
                    _form: [error instanceof Error ? error.message : 'Erro interno do servidor'],
                },
            };
        }
    });