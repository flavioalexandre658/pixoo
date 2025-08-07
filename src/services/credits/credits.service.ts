import { db } from "../../../db";
import {
  userCredits,
  creditTransactions,
  creditReservations,
  modelCosts,
  UserCredits,
  CreditTransaction as CreditTransactionRecord,
  CreditReservation,
  ModelCost,
} from "../../../db/schema";
import { eq, desc, and, lt } from "drizzle-orm";
import {
  CreditUsageRequest,
  CreditEarnRequest,
  UserCreditsSummary,
} from "../../interfaces/credits.interface";
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

  // Reservar créditos antes da geração (não desconta ainda)
  static async reserveCredits(
    request: CreditUsageRequest
  ): Promise<{ reservationId: string; cost: number }> {
    const { userId, modelId, description } = request;

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
    
    // Criar reserva no banco de dados
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
    await db.insert(creditReservations).values({
      id: reservationId,
      userId,
      modelId,
      amount: modelCost.credits,
      description: description || `Reserva para modelo ${modelId}`,
      status: "pending",
      expiresAt,
    });

    return {
      reservationId,
      cost: modelCost.credits,
    };
  }

  // Confirmar gasto de créditos após geração bem-sucedida (com proteção contra concorrência)
  static async confirmSpendCredits(
    request: CreditUsageRequest & { reservationId: string }
  ): Promise<boolean> {
    const { userId, modelId, imageId, description, reservationId } = request;

    console.log(`🔄 Iniciando confirmação de créditos:`, {
      userId,
      modelId,
      imageId,
      reservationId,
      timestamp: new Date().toISOString()
    });

    // Verificar se a reserva existe e seu status atual
    const [reservation] = await db
      .select()
      .from(creditReservations)
      .where(
        and(
          eq(creditReservations.id, reservationId),
          eq(creditReservations.userId, userId)
        )
      )
      .limit(1);

    if (!reservation) {
      console.error(`❌ Reserva não encontrada:`, {
        reservationId,
        userId,
        timestamp: new Date().toISOString()
      });
      throw new Error("Reserva não encontrada");
    }

    // Se a reserva já foi confirmada, retornar sucesso (idempotência)
    if (reservation.status === "confirmed") {
      console.log(`✅ Reserva já confirmada anteriormente (idempotência):`, {
        reservationId,
        userId,
        confirmedAt: reservation.updatedAt,
        timestamp: new Date().toISOString()
      });
      return true;
    }

    // Se a reserva foi cancelada, não pode ser confirmada
    if (reservation.status === "cancelled") {
      console.error(`❌ Tentativa de confirmar reserva cancelada:`, {
        reservationId,
        userId,
        cancelledAt: reservation.updatedAt,
        timestamp: new Date().toISOString()
      });
      throw new Error("Reserva foi cancelada e não pode ser confirmada");
    }

    // Verificar se a reserva não expirou
    const now = new Date();
    if (now > reservation.expiresAt) {
      console.error(`❌ Tentativa de confirmar reserva expirada:`, {
        reservationId,
        userId,
        expiresAt: reservation.expiresAt,
        currentTime: now,
        timestamp: new Date().toISOString()
      });
      
      // Cancelar reserva expirada
      await db
        .update(creditReservations)
        .set({ status: "cancelled", updatedAt: now })
        .where(eq(creditReservations.id, reservationId));
      
      throw new Error("Reserva expirada");
    }

    // Verificar se ainda está pendente (única condição válida para confirmação)
    if (reservation.status !== "pending") {
      console.error(`❌ Status de reserva inválido para confirmação:`, {
        reservationId,
        userId,
        currentStatus: reservation.status,
        expectedStatus: "pending",
        timestamp: new Date().toISOString()
      });
      throw new Error(`Reserva com status '${reservation.status}' não pode ser confirmada`);
    }

    console.log(`✅ Reserva válida encontrada:`, {
      id: reservation.id,
      userId: reservation.userId,
      modelId: reservation.modelId,
      amount: reservation.amount,
      status: reservation.status,
      expiresAt: reservation.expiresAt,
      createdAt: reservation.createdAt
    });

    // Verificar novamente se tem créditos suficientes
    const hasCredits = await this.hasEnoughCredits(userId, reservation.amount);
    if (!hasCredits) {
      console.error(`❌ Créditos insuficientes no momento da confirmação:`, {
        reservationId,
        userId,
        requiredAmount: reservation.amount,
        timestamp: new Date().toISOString()
      });
      throw new Error("Créditos insuficientes");
    }

    // Atualizar saldo
    const userCredit = await this.getUserCredits(userId);
    if (!userCredit) {
      throw new Error("Usuário não encontrado");
    }

    const newBalance = userCredit.balance - reservation.amount;
    const newTotalSpent = userCredit.totalSpent + reservation.amount;

    try {
      // Usar transação atômica para evitar race conditions
      // Primeiro, tentar marcar a reserva como confirmada (com verificação de status)
      const updateResult = await db
        .update(creditReservations)
        .set({ status: "confirmed", updatedAt: new Date() })
        .where(
          and(
            eq(creditReservations.id, reservationId),
            eq(creditReservations.status, "pending") // Só atualiza se ainda estiver pending
          )
        );

      // Se não conseguiu atualizar (porque não estava mais pending), verificar o status atual
      const [currentReservation] = await db
        .select()
        .from(creditReservations)
        .where(eq(creditReservations.id, reservationId))
        .limit(1);

      if (currentReservation?.status === "confirmed") {
        console.log(`✅ Reserva já foi confirmada por outro processo (race condition detectada):`, {
          reservationId,
          userId,
          timestamp: new Date().toISOString()
        });
        return true; // Idempotência
      }

      if (currentReservation?.status !== "confirmed") {
        throw new Error(`Falha ao confirmar reserva - status atual: ${currentReservation?.status}`);
      }

      // Atualizar saldo do usuário
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
        amount: -reservation.amount,
        description: description || reservation.description,
        relatedImageId: imageId,
        reservationId,
        balanceAfter: newBalance,
        metadata: JSON.stringify({
          modelId: reservation.modelId,
          reservationId,
          confirmedAt: new Date().toISOString(),
        }),
      });

      console.log(`✅ Créditos confirmados com sucesso:`, {
        reservationId,
        userId,
        amount: reservation.amount,
        newBalance,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error(`❌ Erro durante confirmação de créditos:`, {
        reservationId,
        userId,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      throw error;
    }
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
    try {
      // Marcar reserva como cancelada
      await db
        .update(creditReservations)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(
          and(
            eq(creditReservations.id, reservationId),
            eq(creditReservations.status, "pending")
          )
        );
      return true;
    } catch (error) {
      console.error("Erro ao cancelar reserva:", error);
      return false;
    }
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

    const recentTransactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(10);

    return {
      balance: userCredit.balance,
      totalEarned: userCredit.totalEarned,
      totalSpent: userCredit.totalSpent,
      recentTransactions: recentTransactions.map(tx => ({
        ...tx,
        type: tx.type as 'earned' | 'spent' | 'refund' | 'bonus',
        relatedImageId: tx.relatedImageId || undefined,
        reservationId: tx.reservationId || undefined,
        metadata: tx.metadata || undefined
      })),
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
    reservationId?: string;
    balanceAfter: number;
    metadata?: string;
  }): Promise<CreditTransactionRecord> {
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
