"use server";

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { authActionClient } from "@/lib/safe-action";
import { userCredits, subscriptions, creditTransactions } from "@/db/schema";
import { z } from "zod";

const getUserFreeCreditsSchema = z.object({});

export const getUserFreeCredits = authActionClient
  .inputSchema(getUserFreeCreditsSchema)
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

      // Se tem plano ativo, não tem créditos diários
      if (activeSubscription) {
        return {
          success: true,
          data: {
            balance: 0,
            hasActiveSubscription: true,
            canUseDailyCredits: false,
            hoursUntilRenewal: 0,
            lastRenewal: null,
          },
        };
      }

      // Obter dados de créditos do usuário
      const userCredit = await db.query.userCredits.findFirst({
        where: eq(userCredits.userId, userId),
      });

      if (!userCredit) {
        // Se não existe registro, o usuário pode receber créditos iniciais
        return {
          success: true,
          data: {
            balance: 0,
            hasActiveSubscription: false,
            canUseDailyCredits: true,
            hoursUntilRenewal: 0,
            lastRenewal: null,
            needsInitialCredits: true,
          },
        };
      }

      // Buscar última renovação de créditos diários
      const lastDailyRenewal = await db.query.creditTransactions.findFirst({
        where: and(
          eq(creditTransactions.userId, userId),
          eq(creditTransactions.description, "Créditos diários renovados")
        ),
        orderBy: (creditTransactions, { desc }) => [
          desc(creditTransactions.createdAt),
        ],
      });

      // Calcular horas até próxima renovação
      let hoursUntilRenewal = 0;
      let canRenew = true;
      let lastRenewal = null;

      if (lastDailyRenewal) {
        const now = new Date();
        const lastRenewalDate = new Date(lastDailyRenewal.createdAt);
        const hoursSinceLastRenewal =
          (now.getTime() - lastRenewalDate.getTime()) / (1000 * 60 * 60);
        hoursUntilRenewal = Math.max(0, 24 - hoursSinceLastRenewal);
        canRenew = hoursSinceLastRenewal >= 24;
        lastRenewal = lastRenewalDate;
      }

      return {
        success: true,
        data: {
          balance: userCredit.balance,
          hasActiveSubscription: false,
          canUseDailyCredits: true,
          hoursUntilRenewal: Math.ceil(hoursUntilRenewal),
          lastRenewal,
          canRenew,
        },
      };
    } catch (error) {
      console.error("Erro ao obter créditos:", error);
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
