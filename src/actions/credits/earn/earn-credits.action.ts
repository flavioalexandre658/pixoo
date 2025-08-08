'use server';

import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { authActionClient } from '@/lib/safe-action';

import { earnCreditsSchema } from './earn-credits.action.schema';
import { creditTransactions, userCredits } from '@/db/schema';

export const earnCredits = authActionClient
    .inputSchema(earnCreditsSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { userId } = ctx as { userId: string };

        try {
            const { amount, description, type, relatedImageId } = parsedInput;

            // Obter saldo atual
            let userCredit = await db.query.userCredits.findFirst({
                where: eq(userCredits.userId, userId),
            });

            if (!userCredit) {
                userCredit = await db.insert(userCredits).values({
                    id: crypto.randomUUID(),
                    userId,
                    balance: 0,
                    totalEarned: 0,
                    totalSpent: 0,
                }).returning().then((res) => res[0]);
            }

            const newBalance = (userCredit?.balance ?? 0) + amount;
            const newTotalEarned = (userCredit?.totalEarned ?? 0) + amount;

            await db
                .update(userCredits)
                .set({
                    balance: newBalance,
                    totalEarned: newTotalEarned,
                    updatedAt: new Date(),
                })
                .where(eq(userCredits.userId, userId));

            // Registrar transação
            await db.insert(creditTransactions).values({
                id: crypto.randomUUID(),
                userId,
                type,
                amount,
                description,
                relatedImageId,
                balanceAfter: newBalance,
                createdAt: new Date(),
            });

        } catch (error) {
            return {
                success: false,
                errors: {
                    _form: [error ?? 'Internal server error'],
                },
            };

        }
    });
