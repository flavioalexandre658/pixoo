"use server";

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { authActionClient } from "@/lib/safe-action";
import { userCredits, creditTransactions, subscriptions } from "@/db/schema";
import { z } from "zod";

const spendFreeCreditsSchema = z.object({
  modelId: z.string().min(1, "Model ID é obrigatório"),
  description: z.string().optional(),
  imageId: z.string().optional(),
});

export const spendFreeCredits = authActionClient
  .inputSchema(spendFreeCreditsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx as { userId: string };
    const { modelId, description, imageId } = parsedInput;

    try {
      // Verificar se o usuário tem plano ativo
      const activeSubscription = await db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active")
        ),
      });

      // Se tem plano ativo, não pode usar créditos gratuitos
      if (activeSubscription) {
        return {
          success: false,
          errors: {
            _form: [
              "Usuários com plano ativo não podem usar créditos gratuitos",
            ],
          },
        };
      }

      // Obter dados atuais do usuário
      const userCredit = await db.query.userCredits.findFirst({
        where: eq(userCredits.userId, userId),
      });

      if (!userCredit) {
        return {
          success: false,
          errors: {
            _form: ["Registro de créditos não encontrado"],
          },
        };
      }

      // Verificar se tem créditos gratuitos suficientes
      if (userCredit.freeCreditsBalance < 1) {
        return {
          success: false,
          errors: {
            _form: ["Créditos gratuitos insuficientes"],
          },
        };
      }

      // Gastar 1 crédito gratuito
      const newFreeCreditsBalance = userCredit.freeCreditsBalance - 1;
      const now = new Date();

      await db
        .update(userCredits)
        .set({
          freeCreditsBalance: newFreeCreditsBalance,
          totalSpent: userCredit.totalSpent + 1,
          updatedAt: now,
        })
        .where(eq(userCredits.userId, userId));

      // Registrar transação
      await db.insert(creditTransactions).values({
        id: crypto.randomUUID(),
        userId,
        type: "spent",
        amount: -1,
        description: description || `Geração de imagem gratuita - ${modelId}`,
        relatedImageId: imageId,
        balanceAfter: userCredit.balance, // Balance normal não muda
        metadata: JSON.stringify({
          modelId,
          freeCreditsUsed: true,
          freeCreditsBalanceAfter: newFreeCreditsBalance,
        }),
        createdAt: now,
      });

      return {
        success: true,
        data: {
          freeCreditsBalance: newFreeCreditsBalance,
          message: "Crédito gratuito usado com sucesso",
        },
      };
    } catch (error) {
      console.error("Erro ao gastar créditos gratuitos:", error);
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
