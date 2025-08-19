"use server";

import { db } from "@/db";
import { userCredits, creditTransactions } from "@/db/schema/credits.schema";
import { subscriptions } from "@/db/schema/subscriptions.schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { randomUUID } from "crypto";

const DAILY_FREE_CREDITS = 10;
const RENEWAL_INTERVAL_HOURS = 24;

export async function renewDailyCredits() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Usuário não autenticado");
  }

  try {
    // Verificar se o usuário tem assinatura ativa
    const activeSubscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, session.user.id),
        eq(subscriptions.status, "active")
      ),
    });

    // Usuários com assinatura não recebem créditos diários
    if (activeSubscription) {
      return {
        success: false,
        message: "Usuários com assinatura ativa não recebem créditos diários",
      };
    }

    // Buscar créditos do usuário
    const [userCredit] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, session.user.id))
      .limit(1);

    if (!userCredit) {
      // Criar registro de créditos se não existir
      const newBalance = DAILY_FREE_CREDITS;
      const creditId = randomUUID();
      const transactionId = randomUUID();

      await db.transaction(async (tx) => {
        await tx.insert(userCredits).values({
          id: creditId,
          userId: session.user.id,
          balance: newBalance,
          totalEarned: DAILY_FREE_CREDITS,
          totalSpent: 0,
        });

        await tx.insert(creditTransactions).values({
          id: transactionId,
          userId: session.user.id,
          type: "earned",
          amount: DAILY_FREE_CREDITS,
          description: "Créditos diários renovados",
          balanceAfter: newBalance,
        });
      });

      return {
        success: true,
        message: "Créditos diários adicionados com sucesso",
        creditsAdded: DAILY_FREE_CREDITS,
        newBalance,
      };
    }

    // Verificar se já pode renovar (a cada 24 horas)
    const lastTransaction = await db
      .select()
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.userId, session.user.id),
          eq(creditTransactions.description, "Créditos diários renovados")
        )
      )
      .orderBy(creditTransactions.createdAt)
      .limit(1);

    if (lastTransaction.length > 0) {
      const hoursSinceLastRenewal =
        (Date.now() - lastTransaction[0].createdAt.getTime()) /
        (1000 * 60 * 60);

      if (hoursSinceLastRenewal < RENEWAL_INTERVAL_HOURS) {
        return {
          success: false,
          message: "Créditos diários já foram renovados recentemente",
          hoursUntilNext: RENEWAL_INTERVAL_HOURS - hoursSinceLastRenewal,
        };
      }
    }

    // Adicionar créditos diários ao balance atual
    const newBalance = userCredit.balance + DAILY_FREE_CREDITS;
    const transactionId = randomUUID();

    await db.transaction(async (tx) => {
      await tx
        .update(userCredits)
        .set({
          balance: newBalance,
          totalEarned: userCredit.totalEarned + DAILY_FREE_CREDITS,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, session.user.id));

      await tx.insert(creditTransactions).values({
        id: transactionId,
        userId: session.user.id,
        type: "earned",
        amount: DAILY_FREE_CREDITS,
        description: "Créditos diários renovados",
        balanceAfter: newBalance,
      });
    });

    return {
      success: true,
      message: "Créditos diários renovados com sucesso",
      creditsAdded: DAILY_FREE_CREDITS,
      newBalance,
    };
  } catch (error) {
    console.error("Erro ao renovar créditos diários:", error);
    throw new Error("Erro interno do servidor");
  }
}
