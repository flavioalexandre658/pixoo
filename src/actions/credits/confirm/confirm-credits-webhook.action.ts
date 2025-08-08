'use server';

import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { db } from '@/db';
import { actionClient } from '@/lib/safe-action';
import { userCredits, creditReservations, creditTransactions } from '@/db/schema';

import { confirmCreditsWebhookSchema } from './confirm-credits-webhook.action.schema';

export const confirmCreditsWebhook = actionClient
    .inputSchema(confirmCreditsWebhookSchema)
    .action(async ({ parsedInput }) => {
        const { userId, reservationId, modelId, imageId, description } = parsedInput;

        try {
            console.log(`🔄 Iniciando confirmação de créditos via webhook:`, {
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
                console.error(`❌ Reserva não encontrada via webhook:`, {
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

            // Verificar se a reserva já foi confirmada (idempotência)
            if (reservation.status === 'confirmed') {
                console.log(`ℹ️ Reserva já confirmada via webhook:`, {
                    reservationId,
                    userId,
                    timestamp: new Date().toISOString()
                });
                return {
                    success: true,
                    data: {
                        message: "Reserva já foi confirmada anteriormente",
                        reservationId,
                        alreadyConfirmed: true
                    }
                };
            }

            // Verificar se a reserva foi cancelada ou expirou
            if (reservation.status === 'cancelled' || reservation.status === 'expired') {
                console.error(`❌ Tentativa de confirmar reserva ${reservation.status} via webhook:`, {
                    reservationId,
                    userId,
                    status: reservation.status,
                    timestamp: new Date().toISOString()
                });
                return {
                    success: false,
                    errors: {
                        _form: [`Não é possível confirmar uma reserva ${reservation.status}`],
                    },
                };
            }

            // Buscar créditos atuais do usuário
            const [userCredit] = await db
                .select()
                .from(userCredits)
                .where(eq(userCredits.userId, userId))
                .limit(1);

            if (!userCredit) {
                console.error(`❌ Créditos do usuário não encontrados via webhook:`, {
                    userId,
                    reservationId,
                    timestamp: new Date().toISOString()
                });
                return {
                    success: false,
                    errors: {
                        _form: ["Créditos do usuário não encontrados"],
                    },
                };
            }

            // Verificar se há créditos suficientes (verificação adicional)
            if (userCredit.balance < reservation.amount) {
                console.error(`❌ Créditos insuficientes para confirmação via webhook:`, {
                    userId,
                    reservationId,
                    required: reservation.amount,
                    available: userCredit.balance,
                    timestamp: new Date().toISOString()
                });
                return {
                    success: false,
                    errors: {
                        _form: ["Créditos insuficientes para confirmação"],
                    },
                };
            }

            // Executar operações sequencialmente (sem transação devido ao driver HTTP do Neon)
            // 1. Atualizar status da reserva para 'confirmed'
            await db
                .update(creditReservations)
                .set({ 
                    status: 'confirmed',
                    updatedAt: new Date()
                })
                .where(eq(creditReservations.id, reservationId));

            // 2. Verificar se a reserva foi atualizada corretamente
            const [updatedReservation] = await db
                .select()
                .from(creditReservations)
                .where(eq(creditReservations.id, reservationId))
                .limit(1);

            if (updatedReservation?.status !== 'confirmed') {
                throw new Error('Falha ao confirmar reserva');
            }

            // 3. Calcular novos valores
            const newBalance = userCredit.balance - reservation.amount;
            const newTotalSpent = userCredit.totalSpent + reservation.amount;

            // 4. Atualizar saldo e total gasto do usuário
            await db
                .update(userCredits)
                .set({
                    balance: newBalance,
                    totalSpent: newTotalSpent,
                    updatedAt: new Date()
                })
                .where(eq(userCredits.userId, userId));

            // 5. Registrar transação de crédito
            const transactionId = randomUUID();
            await db.insert(creditTransactions).values({
                id: transactionId,
                userId,
                amount: -reservation.amount,
                type: 'spent',
                description: description || `Confirmação de créditos via webhook - ${modelId}`,
                relatedImageId: imageId,
                reservationId,
                balanceAfter: newBalance,
                metadata: JSON.stringify({
                    imageId,
                    modelId,
                    reservationId,
                    confirmedViaWebhook: true
                })
            });

            const result = {
                transactionId,
                newBalance,
                amountSpent: reservation.amount
            };

            console.log(`✅ Créditos confirmados com sucesso via webhook:`, {
                userId,
                reservationId,
                modelId,
                imageId,
                amountSpent: result.amountSpent,
                newBalance: result.newBalance,
                transactionId: result.transactionId,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                data: {
                    message: "Créditos confirmados com sucesso",
                    reservationId,
                    transactionId: result.transactionId,
                    amountSpent: result.amountSpent,
                    newBalance: result.newBalance
                }
            };

        } catch (error) {
            console.error(`❌ Erro ao confirmar créditos via webhook:`, {
                userId,
                reservationId,
                modelId,
                imageId,
                error: error instanceof Error ? error.message : 'Erro desconhecido',
                timestamp: new Date().toISOString()
            });

            return {
                success: false,
                errors: {
                    _form: ["Erro interno ao confirmar créditos"],
                },
            };
        }
    });