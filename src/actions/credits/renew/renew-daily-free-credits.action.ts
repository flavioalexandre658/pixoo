"use server";

import { eq, and, lt } from "drizzle-orm";
import { db } from "@/db";
import { authActionClient } from "@/lib/safe-action";
import { userCredits, creditTransactions, subscriptions } from "@/db/schema";
import { z } from "zod";

const renewDailyFreeCreditsSchema = z.object({});

export const renewDailyFreeCredits = authActionClient
  .inputSchema(renewDailyFreeCreditsSchema)
  .action(async ({ ctx }) => {
    const { userId } = ctx as { userId: string };

    try {
      // Verificar se o usuário tem plano ativo
      const activeSubscription = await db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active")
        ),
      });

      // Se tem plano ativo, não renova créditos gratuitos
      if (activeSubscription) {
        return {
          success: false,
          errors: {
            _form: ["Usuários com plano ativo não recebem créditos gratuitos"],
          },
        };
      }

      // Obter dados atuais do usuário
      let userCredit = await db.query.userCredits.findFirst({
        where: eq(userCredits.userId, userId),
      });

      // Se não existe registro, criar um
      if (!userCredit) {
        userCredit = await db
          .insert(userCredits)
          .values({
            id: crypto.randomUUID(),
            userId,
            balance: 0,
            totalEarned: 0,
            totalSpent: 0,
            freeCreditsBalance: 10, // Alterado de 5 para 10
            lastFreeCreditsRenewal: new Date(),
          })
          .returning()
          .then((res) => res[0]);

        // Registrar transação inicial
        await db.insert(creditTransactions).values({
          id: crypto.randomUUID(),
          userId,
          type: "bonus",
          amount: 10, // Alterado de 5 para 10
          description: "Créditos gratuitos iniciais - flux-schnell",
          balanceAfter: 10, // Alterado de 5 para 10
          createdAt: new Date(),
        });

        return {
          success: true,
          data: {
            freeCreditsBalance: 10, // Alterado de 5 para 10
            message: "Créditos gratuitos iniciais concedidos",
          },
        };
      }

      // Verificar se já passou 24 horas desde a última renovação
      const now = new Date();
      const lastRenewal = new Date(userCredit.lastFreeCreditsRenewal);
      const hoursSinceLastRenewal =
        (now.getTime() - lastRenewal.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastRenewal < 24) {
        const hoursRemaining = Math.ceil(24 - hoursSinceLastRenewal);
        return {
          success: false,
          errors: {
            _form: [
              `Créditos gratuitos serão renovados em ${hoursRemaining} horas`,
            ],
          },
        };
      }

      // Renovar créditos gratuitos para 10
      const newFreeCreditsBalance = 10; // Alterado de 5 para 10

      await db
        .update(userCredits)
        .set({
          freeCreditsBalance: newFreeCreditsBalance,
          lastFreeCreditsRenewal: now,
          updatedAt: now,
        })
        .where(eq(userCredits.userId, userId));

      // Registrar transação de renovação
      await db.insert(creditTransactions).values({
        id: crypto.randomUUID(),
        userId,
        type: "bonus",
        amount: newFreeCreditsBalance - userCredit.freeCreditsBalance,
        description: "Renovação diária de créditos gratuitos - flux-schnell",
        balanceAfter:
          userCredit.balance +
          (newFreeCreditsBalance - userCredit.freeCreditsBalance),
        createdAt: now,
      });

      return {
        success: true,
        data: {
          freeCreditsBalance: newFreeCreditsBalance,
          message: "Créditos gratuitos renovados com sucesso",
        },
      };
    } catch (error) {
      console.error("Erro ao renovar créditos gratuitos:", error);
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