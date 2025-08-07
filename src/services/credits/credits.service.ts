import { db } from "../../../db";
import {
  userCredits,
  creditTransactions,
  modelCosts,
  UserCredits,
  CreditTransaction,
  ModelCost,
} from "../../../db/schema";
import { eq, desc, and } from "drizzle-orm";
import {
  CreditUsageRequest,
  CreditEarnRequest,
  UserCreditsSummary,
  CreditTransactionRecord,
} from "@/interfaces/credits.interface";
import { MODEL_COSTS } from "@/config/model-costs";
import { randomUUID } from "crypto";

export class CreditsService {
  // Obter saldo de créditos do usuário
  static async getUserCredits(userId: string): Promise<UserCredits | null> {
    const [userCredit] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);

    return userCredit || null;
  }

  // Criar registro de créditos para novo usuário
  static async createUserCredits(
    userId: string,
    initialCredits: number = 10
  ): Promise<UserCredits> {
    const [newUserCredits] = await db
      .insert(userCredits)
      .values({
        id: randomUUID(),
        userId,
        balance: initialCredits,
        totalEarned: initialCredits,
        totalSpent: 0,
      })
      .returning();

    // Registrar transação inicial
    if (initialCredits > 0) {
      await this.createTransaction({
        userId,
        type: "bonus",
        amount: initialCredits,
        description: "Créditos de boas-vindas",
        balanceAfter: initialCredits,
      });
    }

    return newUserCredits;
  }

  // Verificar se usuário tem créditos suficientes
  static async hasEnoughCredits(
    userId: string,
    requiredCredits: number
  ): Promise<boolean> {
    const userCredit = await this.getUserCredits(userId);
    return userCredit ? userCredit.balance >= requiredCredits : false;
  }

  // Gastar créditos
  // Reservar créditos antes da geração (não desconta ainda)
  static async reserveCredits(
    request: CreditUsageRequest
  ): Promise<{ reservationId: string; cost: number }> {
    const { userId, modelId } = request;

    // Obter custo do modelo
    const modelCost = await this.getModelCost(modelId);
    if (!modelCost) {
      throw new Error(`Modelo ${modelId} não encontrado`);
    }

    // Verificar se tem créditos suficientes
    const hasCredits = await this.hasEnoughCredits(userId, modelCost.credits);
    if (!hasCredits) {
      throw new Error("Créditos insuficientes");
    }

    // Gerar ID de reserva
    const reservationId = randomUUID();

    return {
      reservationId,
      cost: modelCost.credits,
    };
  }

  // Confirmar gasto de créditos após geração bem-sucedida
  static async confirmSpendCredits(
    request: CreditUsageRequest & { reservationId: string }
  ): Promise<boolean> {
    const { userId, modelId, imageId, description, reservationId } = request;

    // Obter custo do modelo
    const modelCost = await this.getModelCost(modelId);
    if (!modelCost) {
      throw new Error(`Modelo ${modelId} não encontrado`);
    }

    // Verificar novamente se tem créditos suficientes
    const hasCredits = await this.hasEnoughCredits(userId, modelCost.credits);
    if (!hasCredits) {
      throw new Error("Créditos insuficientes");
    }

    // Atualizar saldo
    const userCredit = await this.getUserCredits(userId);
    if (!userCredit) {
      throw new Error("Usuário não encontrado");
    }

    const newBalance = userCredit.balance - modelCost.credits;
    const newTotalSpent = userCredit.totalSpent + modelCost.credits;

    await db
      .update(userCredits)
      .set({
        balance: newBalance,
        totalSpent: newTotalSpent,
        updatedAt: new Date(),
      })
      .where(eq(userCredits.userId, userId));

    // Registrar transação
    await this.createTransaction({
      userId,
      type: "spent",
      amount: -modelCost.credits,
      description: description || `Geração de imagem - ${modelCost.modelName}`,
      relatedImageId: imageId,
      balanceAfter: newBalance,
      metadata: JSON.stringify({
        modelId,
        modelName: modelCost.modelName,
        reservationId,
      }),
    });

    return true;
  }

  // Método legado mantido para compatibilidade
  static async spendCredits(request: CreditUsageRequest): Promise<boolean> {
    return this.confirmSpendCredits({
      ...request,
      reservationId: randomUUID(),
    });
  }

  // Cancelar reserva de créditos (em caso de falha na geração)
  static async cancelReservation(reservationId: string): Promise<boolean> {
    // Por enquanto, apenas retorna true pois não estamos persistindo reservas
    // Em uma implementação mais robusta, poderíamos persistir reservas temporárias
    return true;
  }

  // Reembolsar créditos em caso de falha após desconto
  static async refundCredits(request: {
    userId: string;
    amount: number;
    description: string;
    relatedImageId?: string;
    originalTransactionId?: string;
  }): Promise<boolean> {
    const {
      userId,
      amount,
      description,
      relatedImageId,
      originalTransactionId,
    } = request;

    // Obter saldo atual
    const userCredit = await this.getUserCredits(userId);
    if (!userCredit) {
      throw new Error("Usuário não encontrado");
    }

    const newBalance = userCredit.balance + amount;
    const newTotalSpent = Math.max(0, userCredit.totalSpent - amount);

    await db
      .update(userCredits)
      .set({
        balance: newBalance,
        totalSpent: newTotalSpent,
        updatedAt: new Date(),
      })
      .where(eq(userCredits.userId, userId));

    // Registrar transação de reembolso
    await this.createTransaction({
      userId,
      type: "refund",
      amount,
      description,
      relatedImageId,
      balanceAfter: newBalance,
      metadata: originalTransactionId
        ? JSON.stringify({ originalTransactionId })
        : undefined,
    });

    return true;
  }

  // Adicionar créditos
  static async earnCredits(request: CreditEarnRequest): Promise<boolean> {
    const { userId, amount, description, type, relatedImageId } = request;

    // Obter saldo atual
    let userCredit = await this.getUserCredits(userId);
    if (!userCredit) {
      userCredit = await this.createUserCredits(userId, 0);
    }

    const newBalance = userCredit.balance + amount;
    const newTotalEarned = userCredit.totalEarned + amount;

    await db
      .update(userCredits)
      .set({
        balance: newBalance,
        totalEarned: newTotalEarned,
        updatedAt: new Date(),
      })
      .where(eq(userCredits.userId, userId));

    // Registrar transação
    await this.createTransaction({
      userId,
      type,
      amount,
      description,
      relatedImageId,
      balanceAfter: newBalance,
    });

    return true;
  }

  // Obter resumo de créditos do usuário
  static async getUserCreditsSummary(
    userId: string
  ): Promise<UserCreditsSummary> {
    const userCredit = await this.getUserCredits(userId);
    if (!userCredit) {
      return {
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        recentTransactions: [],
      };
    }

    const recentTransactions = (await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(10)) as CreditTransactionRecord[];

    return {
      balance: userCredit.balance,
      totalEarned: userCredit.totalEarned,
      totalSpent: userCredit.totalSpent,
      recentTransactions,
    };
  }

  // Obter custo do modelo
  static async getModelCost(modelId: string): Promise<ModelCost | null> {
    const [cost] = await db
      .select()
      .from(modelCosts)
      .where(
        and(eq(modelCosts.modelId, modelId), eq(modelCosts.isActive, "true"))
      )
      .limit(1);

    return cost || null;
  }

  // Criar transação
  private static async createTransaction(data: {
    userId: string;
    type: "earned" | "spent" | "refund" | "bonus";
    amount: number;
    description: string;
    relatedImageId?: string;
    balanceAfter: number;
    metadata?: string;
  }): Promise<CreditTransaction> {
    const [transaction] = await db
      .insert(creditTransactions)
      .values({
        id: randomUUID(),
        ...data,
      })
      .returning();

    return transaction;
  }

  // Inicializar custos dos modelos
  static async initializeModelCosts(): Promise<void> {
    const models = [
      { id: "flux-schnell", name: "Flux Schnell", credits: 0 },
      { id: "flux-dev", name: "Flux Dev", credits: 2 },
      { id: "flux-pro", name: "Flux Pro", credits: 5 },
      { id: "flux-pro-1.1", name: "Flux Pro 1.1", credits: 4 },
      { id: "flux-pro-1.1-ultra", name: "Flux Pro 1.1 Ultra", credits: 6 },
      { id: "flux-realism", name: "Flux Realism", credits: 3 },
      { id: "flux-kontext-pro", name: "Flux Kontext Pro", credits: 4 },
    ];

    for (const model of models) {
      const existing = await this.getModelCost(model.id);
      if (!existing) {
        await db.insert(modelCosts).values({
          id: randomUUID(),
          modelId: model.id,
          modelName: model.name,
          credits: model.credits,
          isActive: "true",
        });
      }
    }
  }
}
