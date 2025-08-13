'use server';

import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { authActionClient } from '@/lib/safe-action';
import { userCredits, subscriptions } from '@/db/schema';
import { z } from 'zod';

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
          eq(subscriptions.status, 'active')
        ),
      });

      // Se tem plano ativo, não tem créditos gratuitos
      if (activeSubscription) {
        return {
          success: true,
          data: {
            freeCreditsBalance: 0,
            hasActiveSubscription: true,
            canUseFreeCredits: false,
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
            freeCreditsBalance: 0,
            hasActiveSubscription: false,
            canUseFreeCredits: true,
            hoursUntilRenewal: 0,
            lastRenewal: null,
            needsInitialCredits: true,
          },
        };
      }

      // Calcular horas até próxima renovação
      const now = new Date();
      const lastRenewal = new Date(userCredit.lastFreeCreditsRenewal);
      const hoursSinceLastRenewal = (now.getTime() - lastRenewal.getTime()) / (1000 * 60 * 60);
      const hoursUntilRenewal = Math.max(0, 24 - hoursSinceLastRenewal);
      const canRenew = hoursSinceLastRenewal >= 24;

      return {
        success: true,
        data: {
          freeCreditsBalance: userCredit.freeCreditsBalance,
          hasActiveSubscription: false,
          canUseFreeCredits: true,
          hoursUntilRenewal: Math.ceil(hoursUntilRenewal),
          lastRenewal: userCredit.lastFreeCreditsRenewal,
          canRenew,
        },
      };
    } catch (error) {
      console.error('Erro ao obter créditos gratuitos:', error);
      return {
        success: false,
        errors: {
          _form: [error instanceof Error ? error.message : 'Erro interno do servidor'],
        },
      };
    }
  });