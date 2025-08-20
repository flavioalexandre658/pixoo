"use server";

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { authActionClient } from "@/lib/safe-action";
import { userCredits, subscriptions, creditTransactions } from "@/db/schema";
import { z } from "zod";

const getUserMonthlyCreditsSchema = z.object({});

// Defina o tipo esperado pelo front
export type FreeCreditsData = {
  balance: number;
  hasActiveSubscription: boolean;
  canUseMonthlyCredits: boolean;
  canUseDailyCredits: boolean;   // 🔥 campos que estavam faltando
  daysUntilRenewal: number;
  hoursUntilRenewal: number;     // 🔥 idem
  lastRenewal: Date | null;
  needsInitialCredits?: boolean;
  canRenew?: boolean;
};

export const getUserMonthlyCredits = authActionClient
  .inputSchema(getUserMonthlyCreditsSchema)
  .action(async ({ ctx }) => {
    const { userId } = ctx as { userId: string };

    try {
      const activeSubscription = await db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active")
        ),
      });

      if (activeSubscription) {
        return {
          success: true,
          data: {
            balance: 0,
            hasActiveSubscription: true,
            canUseMonthlyCredits: false,
            canUseDailyCredits: false,   // sempre defina
            daysUntilRenewal: 0,
            hoursUntilRenewal: 0,       // idem
            lastRenewal: null,
          } satisfies FreeCreditsData,
        };
      }

      const userCredit = await db.query.userCredits.findFirst({
        where: eq(userCredits.userId, userId),
      });

      if (!userCredit) {
        return {
          success: true,
          data: {
            balance: 0,
            hasActiveSubscription: false,
            canUseMonthlyCredits: true,
            canUseDailyCredits: false,
            daysUntilRenewal: 0,
            hoursUntilRenewal: 0,
            lastRenewal: null,
            needsInitialCredits: true,
          } satisfies FreeCreditsData,
        };
      }

      const lastMonthlyRenewal = await db.query.creditTransactions.findFirst({
        where: and(
          eq(creditTransactions.userId, userId),
          eq(creditTransactions.description, "Créditos mensais renovados")
        ),
        orderBy: (creditTransactions, { desc }) => [
          desc(creditTransactions.createdAt),
        ],
      });

      let daysUntilRenewal = 0;
      let hoursUntilRenewal = 0;
      let canRenew = true;
      let lastRenewal: Date | null = null;

      if (lastMonthlyRenewal) {
        const now = new Date();
        const lastRenewalDate = new Date(lastMonthlyRenewal.createdAt);
        const diffMs = now.getTime() - lastRenewalDate.getTime();
        const daysSinceLastRenewal = diffMs / (1000 * 60 * 60 * 24);

        daysUntilRenewal = Math.max(0, 30 - daysSinceLastRenewal);
        hoursUntilRenewal = Math.max(0, 30 * 24 - diffMs / (1000 * 60 * 60));
        canRenew = daysSinceLastRenewal >= 30;
        lastRenewal = lastRenewalDate;
      }

      return {
        success: true,
        data: {
          balance: userCredit.balance,
          hasActiveSubscription: false,
          canUseMonthlyCredits: true,
          canUseDailyCredits: false,
          daysUntilRenewal: Math.ceil(daysUntilRenewal),
          hoursUntilRenewal: Math.ceil(hoursUntilRenewal),
          lastRenewal,
          canRenew,
        } satisfies FreeCreditsData,
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
