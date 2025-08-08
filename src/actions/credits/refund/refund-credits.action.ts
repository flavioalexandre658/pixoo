'use server';

import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { db } from '@/db';
import { authActionClient } from '@/lib/safe-action';
import { userCredits, creditTransactions } from '@/db/schema';

import { refundCreditsSchema } from './refund-credits.action.schema';

export const refundCredits = authActionClient
    .inputSchema(refundCreditsSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { userId } = ctx as { userId: string };
        const { amount, description, relatedImageId, originalTransactionId } = parsedInput;

        try {
            console.log(`🔄 Iniciando reembolso de créditos:`, {
                userId,
                amount,
                description,
                relatedImageId,
                originalTransactionId,
                timestamp: new Date().toISOString()
            });

            // Buscar créditos do usuário
            const [userCredit] = await db
                .select()
                .from(userCredits)
                .where(eq(userCredits.userId, userId))
                .limit(1);

            if (!userCredit) {
                console.error(`❌ Usuário não encontrado:`, {
                    userId,
                    timestamp: new Date().toISOString()
                });
                return {
                    success: false,
                    errors: {
                        _form: ["Usuário não encontrado"],
                    },
                };
            }

            // Verificar se a transação original existe (se fornecida)
            if (originalTransactionId) {
                const [originalTransaction] = await db
                    .select()
                    .from(creditTransactions)
                    .where(
                        eq(creditTransactions.id, originalTransactionId)
                    )
                    .limit(1);

                if (!originalTransaction) {
                    console.error(`❌ Transação original não encontrada:`, {
                        originalTransactionId,
                        userId,
                        timestamp: new Date().toISOString()
                    });
                    return {
                        success: false,
                        errors: {
                            _form: ["Transação original não encontrada"],
                        },
                    };
                }

                // Verificar se a transação original pertence ao usuário
                if (originalTransaction.userId !== userId) {
                    console.error(`❌ Transação original não pertence ao usuário:`, {
                        originalTransactionId,
                        originalUserId: originalTransaction.userId,
                        requestingUserId: userId,
                        timestamp: new Date().toISOString()
                    });
                    return {
                        success: false,
                        errors: {
                            _form: ["Transação original não pertence ao usuário"],
                        },
                    };
                }

                // Verificar se o valor do reembolso não excede o valor original gasto
                if (originalTransaction.type === "spent" && Math.abs(originalTransaction.amount) < amount) {
                    console.error(`❌ Valor do reembolso excede o valor original:`, {
                        originalTransactionId,
                        originalAmount: Math.abs(originalTransaction.amount),
                        refundAmount: amount,
                        userId,
                        timestamp: new Date().toISOString()
                    });
                    return {
                        success: false,
                        errors: {
                            _form: [`Valor do reembolso (${amount}) excede o valor original gasto (${Math.abs(originalTransaction.amount)})`],
                        },
                    };
                }
            }

            const newBalance = userCredit.balance + amount;
            const newTotalEarned = userCredit.totalEarned + amount;

            // Atualizar saldo do usuário
            await db
                .update(userCredits)
                .set({
                    balance: newBalance,
                    totalEarned: newTotalEarned,
                    updatedAt: new Date(),
                })
                .where(eq(userCredits.userId, userId));

            // Registrar transação de reembolso
            await db.insert(creditTransactions).values({
                id: randomUUID(),
                userId,
                type: "refund",
                amount: amount,
                description,
                relatedImageId,
                balanceAfter: newBalance,
                metadata: JSON.stringify({
                    originalTransactionId,
                    refundedAt: new Date().toISOString(),
                    refundReason: description,
                }),
            });

            console.log(`✅ Créditos reembolsados com sucesso:`, {
                userId,
                amount,
                newBalance,
                originalTransactionId,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                data: { 
                    message: "Créditos reembolsados com sucesso",
                    newBalance,
                    amountRefunded: amount
                },
            };
        } catch (error) {
            console.error(`❌ Erro durante reembolso de créditos:`, {
                userId,
                amount,
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