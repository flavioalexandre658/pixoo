"use server";

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@/db";
import {
  creditPackagePurchases,
  userCredits,
  creditTransactions,
} from "@/db/schema";

export async function earnCreditsFromPackage({
  stripeSessionId,
  stripePaymentIntentId,
}: {
  stripeSessionId: string;
  stripePaymentIntentId?: string;
}) {
  try {
    console.log(`💰 Processando créditos do pacote:`, {
      stripeSessionId,
      stripePaymentIntentId,
    });

    // Buscar a compra pendente
    const purchase = await db
      .select()
      .from(creditPackagePurchases)
      .where(eq(creditPackagePurchases.stripeSessionId, stripeSessionId))
      .limit(1)
      .then((results) => results[0]);

    if (!purchase) {
      throw new Error(`Compra não encontrada para sessão: ${stripeSessionId}`);
    }

    if (purchase.status === "completed") {
      console.log(`⚠️ Compra já processada: ${purchase.id}`);
      return { success: true, message: "Compra já processada" };
    }

    // Buscar créditos do usuário
    const userCredit = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, purchase.userId))
      .limit(1)
      .then((results) => results[0]);

    if (!userCredit) {
      throw new Error(`Créditos do usuário não encontrados: ${purchase.userId}`);
    }

    const newBalance = userCredit.balance + purchase.credits;
    const newTotalEarned = userCredit.totalEarned + purchase.credits;

    // Atualizar saldo do usuário
    await db
      .update(userCredits)
      .set({
        balance: newBalance,
        totalEarned: newTotalEarned,
        updatedAt: new Date(),
      })
      .where(eq(userCredits.userId, purchase.userId));

    // Registrar transação
    await db.insert(creditTransactions).values({
      id: nanoid(),
      userId: purchase.userId,
      type: "earned",
      amount: purchase.credits,
      description: `Compra de pacote de créditos - ${purchase.credits} créditos`,
      metadata: JSON.stringify({
        packageId: purchase.packageId,
        purchaseId: purchase.id,
        stripeSessionId,
        stripePaymentIntentId,
      }),
      balanceAfter: newBalance,
    });

    // Marcar compra como concluída
    await db
      .update(creditPackagePurchases)
      .set({
        status: "completed",
        stripePaymentIntentId,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(creditPackagePurchases.id, purchase.id));

    console.log(`✅ Créditos adicionados:`, {
      userId: purchase.userId,
      credits: purchase.credits,
      newBalance,
    });

    return {
      success: true,
      data: {
        creditsAdded: purchase.credits,
        newBalance,
      },
    };
  } catch (error) {
    console.error("❌ Erro ao processar créditos do pacote:", error);
    throw error;
  }
}