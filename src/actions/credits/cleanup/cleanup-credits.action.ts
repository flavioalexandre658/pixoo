'use server';

import { authActionClient } from '@/lib/safe-action';
import { CreditsCleanupService } from '@/services/credits/credits-cleanup.service';

import { cleanupCreditsPostSchema, cleanupCreditsGetSchema } from './cleanup-credits.action.schema';

/**
 * Action para executar limpeza manual de reservas de créditos
 */
export const executeCleanup = authActionClient
    .inputSchema(cleanupCreditsPostSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { userId } = ctx as { userId: string };
        const { force } = parsedInput;

        try {
            console.log(`🔄 Executando limpeza manual de créditos:`, {
                userId,
                force,
                timestamp: new Date().toISOString()
            });

            let result;
            if (force) {
                // Forçar limpeza completa
                result = await CreditsCleanupService.fullCleanup();
            } else {
                // Limpeza condicional (respeitando throttling)
                const conditionalResult = await CreditsCleanupService.conditionalCleanup();
                if (!conditionalResult.executed) {
                    return {
                        success: true,
                        data: {
                            executed: false,
                            message: "Limpeza não executada - intervalo mínimo não atingido"
                        }
                    };
                }
                result = conditionalResult.result!;
            }

            console.log(`✅ Limpeza manual executada com sucesso:`, {
                userId,
                force,
                expiredCancelled: result.expired,
                oldDeleted: result.deleted,
                errors: result.errors.length,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                data: {
                    executed: true,
                    expiredReservationsCancelled: result.expired,
                    oldReservationsDeleted: result.deleted,
                    errors: result.errors,
                    message: `Limpeza concluída: ${result.expired} expiradas canceladas, ${result.deleted} antigas deletadas${result.errors.length > 0 ? `, ${result.errors.length} erros` : ''}`
                }
            };
        } catch (error) {
            console.error(`❌ Erro durante limpeza manual:`, {
                userId,
                force,
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
 * Action para obter informações sobre reservas sem executar limpeza
 */
export const getCleanupInfo = authActionClient
    .inputSchema(cleanupCreditsGetSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { userId } = ctx as { userId: string };
        const { action } = parsedInput;

        try {
            console.log(`🔄 Obtendo informações de cleanup:`, {
                userId,
                action,
                timestamp: new Date().toISOString()
            });

            if (action === "stats") {
                // Obter estatísticas das reservas
                const stats = await CreditsCleanupService.getReservationStats();
                
                return {
                    success: true,
                    data: {
                        stats,
                        message: `Estatísticas: ${stats.pending} pendentes, ${stats.confirmed} confirmadas, ${stats.cancelled} canceladas, ${stats.expired} expiradas`
                    }
                };
            }

            if (action === "should-cleanup") {
                // Verificar se deve executar limpeza
                const shouldRun = CreditsCleanupService.shouldRunCleanup();
                
                return {
                    success: true,
                    data: {
                        shouldRunCleanup: shouldRun,
                        message: shouldRun ? "Limpeza recomendada" : "Limpeza não necessária no momento"
                    }
                };
            }

            return {
                success: false,
                errors: {
                    _form: ["Ação inválida. Use 'stats' ou 'should-cleanup'"],
                },
            };
        } catch (error) {
            console.error(`❌ Erro ao obter informações de cleanup:`, {
                userId,
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