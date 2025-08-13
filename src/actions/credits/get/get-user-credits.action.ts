"use server";

import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { authActionClient } from "@/lib/safe-action";
import { userCredits, creditTransactions } from "@/db/schema";

import { getUserCreditsSchema } from "./get-user-credits.action.schema";

export const getUserCredits = authActionClient
    .inputSchema(getUserCreditsSchema)
    .action(async ({ ctx }) => {
        const { userId } = ctx as { userId: string };
        try {
            // Obter créditos do usuário
            const [userCredit] = await db
                .select()
                .from(userCredits)
                .where(eq(userCredits.userId, userId))
                .limit(1);

            if (!userCredit) {
                return {
                    success: true,
                    data: {
                        balance: 0,
                        totalEarned: 0,
                        totalSpent: 0,
                        recentTransactions: [],
                    },
                };
            }

            // Obter transações recentes
            const recentTransactions = await db
                .select()
                .from(creditTransactions)
                .where(eq(creditTransactions.userId, userId))
                .orderBy(desc(creditTransactions.createdAt))
                .limit(10);

            return {
                success: true,
                data: {
                    balance: userCredit.balance,
                    totalEarned: userCredit.totalEarned,
                    totalSpent: userCredit.totalSpent,
                    recentTransactions: recentTransactions.map((tx) => ({
                        ...tx,
                        type: tx.type as "earned" | "spent" | "refund" | "bonus",
                        relatedImageId: tx.relatedImageId || undefined,
                        reservationId: tx.reservationId || undefined,
                        metadata: tx.metadata || undefined,
                    })),
                },
            };
        } catch (error) {
            return {
                success: false,
                errors: {
                    _form: [
                        error instanceof Error ? error.message : "Erro interno do servidor",
                    ],
                },
            };
        }
    });
