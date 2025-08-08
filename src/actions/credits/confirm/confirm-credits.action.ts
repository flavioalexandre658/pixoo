'use server';

import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { db } from '@/db';
import { authActionClient } from '@/lib/safe-action';
import { userCredits, creditReservations, creditTransactions } from '@/db/schema';

import { confirmCreditsSchema } from './confirm-credits.action.schema';

export const confirmCredits = authActionClient
    .inputSchema(confirmCreditsSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { userId } = ctx as { userId: string };
        const { reservationId, modelId, imageId, description } = parsedInput;

        try {
            console.log(`🔄 Iniciando confirmação de créditos:`, {
                userId,
                modelId,
                imageId,
                reservationId,
                timestamp: new Date().toISOString()
            });

            // Verificar se a reserva existe e seu status atual
            const [reservation] = await db
                .select()
                .from(creditReservations)
                .where(
                    and(
                        eq(creditReservations.id, reservationId),
                        eq(creditReservations.userId, userId)
                    )
                )
                .limit(1);

            if (!reservation) {
                console.error(`❌ Reserva não encontrada:`, {
                    reservationId,
                    userId,
                    timestamp: new Date().toISOString()
                });
                return {
                    success: false,
                    errors: {
                        _form: ["Reserva não encontrada"],
                    },
                };
            }

            // Se a reserva já foi confirmada, retornar sucesso (idempotência)
            if (reservation.status === "confirmed") {
                console.log(`✅ Reserva já confirmada anteriormente (idempotência):`, {
                    reservationId,
                    userId,
                    confirmedAt: reservation.updatedAt,
                    timestamp: new Date().toISOString()
                });
                return {
                    success: true,
                    data: { message: "Créditos já confirmados anteriormente" },
                };
            }

            // Se a reserva foi cancelada, não pode ser confirmada
            if (reservation.status === "cancelled") {
                console.error(`❌ Tentativa de confirmar reserva cancelada:`, {
                    reservationId,
                    userId,
                    cancelledAt: reservation.updatedAt,
                    timestamp: new Date().toISOString()
                });
                return {
                    success: false,
                    errors: {
                        _form: ["Reserva foi cancelada e não pode ser confirmada"],
                    },
                };
            }

            // Verificar se a reserva não expirou
            const now = new Date();
            if (now > reservation.expiresAt) {
                console.error(`❌ Tentativa de confirmar reserva expirada:`, {
                    reservationId,
                    userId,
                    expiresAt: reservation.expiresAt,
                    currentTime: now,
                    timestamp: new Date().toISOString()
                });

                // Cancelar reserva expirada
                await db
                    .update(creditReservations)
                    .set({ status: "cancelled", updatedAt: now })
                    .where(eq(creditReservations.id, reservationId));

                return {
                    success: false,
                    errors: {
                        _form: ["Reserva expirada"],
                    },
                };
            }

            // Verificar se ainda está pendente (única condição válida para confirmação)
            if (reservation.status !== "pending") {
                console.error(`❌ Status de reserva inválido para confirmação:`, {
                    reservationId,
                    userId,
                    currentStatus: reservation.status,
                    expectedStatus: "pending",
                    timestamp: new Date().toISOString()
                });
                return {
                    success: false,
                    errors: {
                        _form: [`Reserva com status '${reservation.status}' não pode ser confirmada`],
                    },
                };
            }

            console.log(`✅ Reserva válida encontrada:`, {
                id: reservation.id,
                userId: reservation.userId,
                modelId: reservation.modelId,
                amount: reservation.amount,
                status: reservation.status,
                expiresAt: reservation.expiresAt,
                createdAt: reservation.createdAt
            });

            // Verificar novamente se tem créditos suficientes
            const [userCredit] = await db
                .select()
                .from(userCredits)
                .where(eq(userCredits.userId, userId))
                .limit(1);

            if (!userCredit) {
                return {
                    success: false,
                    errors: {
                        _form: ["Usuário não encontrado"],
                    },
                };
            }

            if (userCredit.balance < reservation.amount) {
                console.error(`❌ Créditos insuficientes no momento da confirmação:`, {
                    reservationId,
                    userId,
                    requiredAmount: reservation.amount,
                    currentBalance: userCredit.balance,
                    timestamp: new Date().toISOString()
                });
                return {
                    success: false,
                    errors: {
                        _form: ["Créditos insuficientes"],
                    },
                };
            }

            const newBalance = userCredit.balance - reservation.amount;
            const newTotalSpent = userCredit.totalSpent + reservation.amount;

            // Usar transação atômica para evitar race conditions
            // Primeiro, tentar marcar a reserva como confirmada (com verificação de status)
            const updateResult = await db
                .update(creditReservations)
                .set({ status: "confirmed", updatedAt: new Date() })
                .where(
                    and(
                        eq(creditReservations.id, reservationId),
                        eq(creditReservations.status, "pending") // Só atualiza se ainda estiver pending
                    )
                );

            // Se não conseguiu atualizar (porque não estava mais pending), verificar o status atual
            const [currentReservation] = await db
                .select()
                .from(creditReservations)
                .where(eq(creditReservations.id, reservationId))
                .limit(1);

            if (currentReservation?.status === "confirmed") {
                console.log(`✅ Reserva já foi confirmada por outro processo (race condition detectada):`, {
                    reservationId,
                    userId,
                    timestamp: new Date().toISOString()
                });
                return {
                    success: true,
                    data: { message: "Créditos já confirmados por outro processo" },
                };
            }

            if (currentReservation?.status !== "confirmed") {
                return {
                    success: false,
                    errors: {
                        _form: [`Falha ao confirmar reserva - status atual: ${currentReservation?.status}`],
                    },
                };
            }

            // Atualizar saldo do usuário
            await db
                .update(userCredits)
                .set({
                    balance: newBalance,
                    totalSpent: newTotalSpent,
                    updatedAt: new Date(),
                })
                .where(eq(userCredits.userId, userId));

            // Registrar transação
            await db.insert(creditTransactions).values({
                id: randomUUID(),
                userId,
                type: "spent",
                amount: -reservation.amount,
                description: description || reservation.description,
                relatedImageId: imageId,
                reservationId,
                balanceAfter: newBalance,
                metadata: JSON.stringify({
                    modelId: reservation.modelId,
                    reservationId,
                    confirmedAt: new Date().toISOString(),
                }),
            });

            console.log(`✅ Créditos confirmados com sucesso:`, {
                reservationId,
                userId,
                amount: reservation.amount,
                newBalance,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                data: { message: "Créditos descontados com sucesso" },
            };
        } catch (error) {
            console.error(`❌ Erro durante confirmação de créditos:`, {
                reservationId,
                userId,
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