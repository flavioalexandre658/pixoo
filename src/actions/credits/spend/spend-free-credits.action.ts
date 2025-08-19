"use server";

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { authActionClient } from "@/lib/safe-action";
import {
  userCredits,
  creditTransactions,
  subscriptions,
  modelCosts,
} from "@/db/schema";
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
      // Buscar custo do modelo
      const modelCost = await db.query.modelCosts.findFirst({
        where: and(
          eq(modelCosts.modelId, modelId),
          eq(modelCosts.isActive, "true")
        ),
      });

      if (!modelCost) {
        return {
          success: false,
          errors: {
            _form: [`Modelo ${modelId} não encontrado`],
          },
        };
      }

      // Verificar se o usuário tem plano ativo
      const activeSubscription = await db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active")
        ),
      });

      // Se tem plano ativo, não pode usar créditos gratuitos (agora unificados)
      if (activeSubscription) {
        return {
          success: false,
          errors: {
            _form: ["Usuários com plano ativo não podem usar créditos diários"],
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

      // Verificar se tem créditos suficientes no balance unificado
      if (userCredit.balance < modelCost.credits) {
        return {
          success: false,
          errors: {
            _form: [
              `Créditos insuficientes. Necessário: ${modelCost.credits}, Disponível: ${userCredit.balance}`,
            ],
          },
        };
      }

      // Gastar créditos do balance unificado
      const newBalance = userCredit.balance - modelCost.credits;
      const now = new Date();

      await db
        .update(userCredits)
        .set({
          balance: newBalance,
          totalSpent: userCredit.totalSpent + modelCost.credits,
          updatedAt: now,
        })
        .where(eq(userCredits.userId, userId));

      // Registrar transação
      await db.insert(creditTransactions).values({
        id: crypto.randomUUID(),
        userId,
        type: "spent",
        amount: -modelCost.credits,
        description:
          description ||
          `Geração de imagem - ${modelCost.modelName} (${modelCost.credits} créditos)`,
        relatedImageId: imageId,
        balanceAfter: newBalance,
        metadata: JSON.stringify({
          modelId,
          modelName: modelCost.modelName,
          creditsUsed: modelCost.credits,
          dailyCreditsUsed: true,
        }),
        createdAt: now,
      });

      return {
        success: true,
        data: {
          balance: newBalance,
          creditsUsed: modelCost.credits,
          message: `${modelCost.credits} crédito(s) usado(s) com sucesso`,
        },
      };
    } catch (error) {
      console.error("Erro ao gastar créditos:", error);
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

// Função interna para uso em webhooks (sem autenticação)
export async function spendFreeCreditsInternal({
  userId,
  modelId,
  description,
  imageId,
}: {
  userId: string;
  modelId: string;
  description?: string;
  imageId?: string;
}) {
  try {
    // Buscar custo do modelo
    const modelCost = await db.query.modelCosts.findFirst({
      where: and(
        eq(modelCosts.modelId, modelId),
        eq(modelCosts.isActive, "true")
      ),
    });

    if (!modelCost) {
      return {
        success: false,
        errors: {
          _form: [`Modelo ${modelId} não encontrado`],
        },
      };
    }

    // Verificar se o usuário tem plano ativo
    const activeSubscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      ),
    });

    // Se tem plano ativo, não pode usar créditos diários
    if (activeSubscription) {
      return {
        success: false,
        errors: {
          _form: ["Usuários com plano ativo não podem usar créditos diários"],
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

    // Verificar se tem créditos suficientes no balance unificado
    if (userCredit.balance < modelCost.credits) {
      return {
        success: false,
        errors: {
          _form: [
            `Créditos insuficientes. Necessário: ${modelCost.credits}, Disponível: ${userCredit.balance}`,
          ],
        },
      };
    }

    // Gastar créditos do balance unificado
    const newBalance = userCredit.balance - modelCost.credits;
    const now = new Date();

    await db
      .update(userCredits)
      .set({
        balance: newBalance,
        totalSpent: userCredit.totalSpent + modelCost.credits,
        updatedAt: now,
      })
      .where(eq(userCredits.userId, userId));

    // Registrar transação
    await db.insert(creditTransactions).values({
      id: crypto.randomUUID(),
      userId,
      type: "spent",
      amount: -modelCost.credits,
      description:
        description ||
        `Geração de imagem - ${modelCost.modelName} (${modelCost.credits} créditos)`,
      relatedImageId: imageId,
      balanceAfter: newBalance,
      metadata: JSON.stringify({
        modelId,
        modelName: modelCost.modelName,
        creditsUsed: modelCost.credits,
        dailyCreditsUsed: true,
      }),
      createdAt: now,
    });

    return {
      success: true,
      data: {
        balance: newBalance,
        creditsUsed: modelCost.credits,
        message: `${modelCost.credits} crédito(s) usado(s) com sucesso`,
      },
    };
  } catch (error) {
    console.error("Erro ao gastar créditos:", error);
    return {
      success: false,
      errors: {
        _form: [
          error instanceof Error ? error.message : "Erro interno do servidor",
        ],
      },
    };
  }
}
