'use server';

import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { db } from '@/db';
import { authActionClient } from '@/lib/safe-action';
import { userCredits, creditTransactions, modelCosts } from '@/db/schema';

import { spendCreditsSchema } from './spend-credits.action.schema';

export const spendCredits = authActionClient
    .inputSchema(spendCreditsSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { userId } = ctx as { userId: string };
        const { modelId, imageId, description } = parsedInput;

        try {
            console.log(`🔄 Iniciando gasto direto de créditos:`, {
                userId,
                modelId,
                imageId,
                timestamp: new Date().toISOString()
            });

            // Buscar informações do modelo
            const [model] = await db
                .select()
                .from(modelCosts)
                .where(eq(modelCosts.id, modelId))
                .limit(1);

            if (!model) {
                console.error(`❌ Modelo não encontrado:`, {
                    modelId,
                    userId,
                    timestamp: new Date().toISOString()
                });
                return {
                    success: false,
                    errors: {
                        _form: ["Modelo não encontrado"],
                    },
                };
            }

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

            // Verificar se tem créditos suficientes
            if (userCredit.balance < model.credits) {
                console.error(`❌ Créditos insuficientes:`, {
                    userId,
                    modelId,
                    requiredAmount: model.credits,
                    currentBalance: userCredit.balance,
                    timestamp: new Date().toISOString()
                });
                return {
                    success: false,
                    errors: {
                        _form: [`Créditos insuficientes. Necessário: ${model.credits}, Disponível: ${userCredit.balance}`],
                    },
                };
            }

            const newBalance = userCredit.balance - model.credits;
            const newTotalSpent = userCredit.totalSpent + model.credits;

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
                amount: -model.credits,
                description: description || `Geração de imagem - ${model.modelName}`,
                relatedImageId: imageId,
                balanceAfter: newBalance,
                metadata: JSON.stringify({
                    modelId: model.id,
                    modelName: model.modelName,
                    directSpend: true,
                    spentAt: new Date().toISOString(),
                }),
            });

            console.log(`✅ Créditos gastos com sucesso:`, {
                userId,
                modelId,
                amount: model.credits,
                newBalance,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                data: {
                    message: "Créditos gastos com sucesso",
                    newBalance,
                    amountSpent: model.credits
                },
            };
        } catch (error) {
            console.error(`❌ Erro durante gasto de créditos:`, {
                userId,
                modelId,
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