'use server';

import { actionClient } from '@/lib/safe-action';
import { creditsAutoCleanup } from '@/lib/credits-auto-cleanup';

import { autoCleanupCreditsGetSchema, autoCleanupCreditsPostSchema } from './auto-cleanup-credits.action.schema';

/**
 * Action para obter status e estatísticas do sistema de limpeza automática
 */
export const getAutoCleanupStatus = actionClient
    .inputSchema(autoCleanupCreditsGetSchema)
    .action(async ({ parsedInput }) => {
        const { action } = parsedInput;

        try {
            console.log(`🔄 Obtendo informações de auto-cleanup:`, {
                action,
                timestamp: new Date().toISOString()
            });

            switch (action) {
                case "status":
                    return {
                        success: true,
                        data: creditsAutoCleanup.getStatus()
                    };

                case "stats":
                    const stats = await creditsAutoCleanup.getStats();
                    return {
                        success: true,
                        data: stats
                    };

                default:
                    // Retorna status e stats por padrão
                    const [status, statsData] = await Promise.all([
                        creditsAutoCleanup.getStatus(),
                        creditsAutoCleanup.getStats()
                    ]);

                    return {
                        success: true,
                        data: {
                            status,
                            stats: statsData
                        }
                    };
            }
        } catch (error) {
            console.error(`❌ Erro ao obter informações de auto-cleanup:`, {
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

/**
 * Action para controlar o sistema de limpeza automática
 */
export const controlAutoCleanup = actionClient
    .inputSchema(autoCleanupCreditsPostSchema)
    .action(async ({ parsedInput }) => {
        const { action } = parsedInput;

        try {
            console.log(`🔄 Controlando auto-cleanup:`, {
                action,
                timestamp: new Date().toISOString()
            });

            switch (action) {
                case "start":
                    creditsAutoCleanup.start();
                    return {
                        success: true,
                        data: {
                            message: "Limpeza automática iniciada",
                            status: creditsAutoCleanup.getStatus()
                        }
                    };

                case "stop":
                    creditsAutoCleanup.stop();
                    return {
                        success: true,
                        data: {
                            message: "Limpeza automática parada",
                            status: creditsAutoCleanup.getStatus()
                        }
                    };

                case "force":
                    const result = await creditsAutoCleanup.forceCleanup();
                    return {
                        success: true,
                        data: {
                            message: "Limpeza forçada executada",
                            result
                        }
                    };

                default:
                    return {
                        success: false,
                        errors: {
                            _form: ["Ação inválida. Ações válidas: start, stop, force"],
                        },
                    };
            }
        } catch (error) {
            console.error(`❌ Erro ao controlar auto-cleanup:`, {
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