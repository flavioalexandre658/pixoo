import { db } from "../../db";
import {
  userCredits,
  creditTransactions,
  creditReservations,
  modelCosts
} from "../../db/schema";
import { eq, desc, and, gte, lte, count, sum, avg, sql } from "drizzle-orm";
import { ReservationStatus, TransactionType } from "@/interfaces/credits.interface";

/**
 * Serviço de monitoramento e métricas do sistema de créditos
 * Fornece insights sobre saúde, performance e uso do sistema
 */
export class CreditsMonitoringService {
  /**
   * Obtém métricas gerais do sistema de créditos
   */
  static async getSystemMetrics(): Promise<{
    users: {
      total: number;
      withCredits: number;
      averageBalance: number;
      totalBalance: number;
    };
    reservations: {
      total: number;
      pending: number;
      confirmed: number;
      cancelled: number;
      expired: number;
    };
    transactions: {
      total: number;
      totalVolume: number;
      byType: Record<TransactionType, number>;
    };
    models: {
      total: number;
      active: number;
      averageCost: number;
    };
  }> {
    // Métricas de usuários
    const [usersTotal] = await db
      .select({ count: count() })
      .from(userCredits);

    const [usersWithCredits] = await db
      .select({ count: count() })
      .from(userCredits)
      .where(sql`${userCredits.balance} > 0`);

    const [balanceStats] = await db
      .select({
        avg: avg(userCredits.balance),
        total: sum(userCredits.balance)
      })
      .from(userCredits);

    // Métricas de reservas
    const reservationStats = await db
      .select({
        status: creditReservations.status,
        count: count()
      })
      .from(creditReservations)
      .groupBy(creditReservations.status);

    const [reservationsTotal] = await db
      .select({ count: count() })
      .from(creditReservations);

    // Métricas de transações
    const [transactionsTotal] = await db
      .select({ count: count() })
      .from(creditTransactions);

    const [transactionVolume] = await db
      .select({ total: sum(sql`ABS(${creditTransactions.amount})`) })
      .from(creditTransactions);

    const transactionsByType = await db
      .select({
        type: creditTransactions.type,
        count: count()
      })
      .from(creditTransactions)
      .groupBy(creditTransactions.type);

    // Métricas de modelos
    const [modelsTotal] = await db
      .select({ count: count() })
      .from(modelCosts);

    const [modelsActive] = await db
      .select({ count: count() })
      .from(modelCosts)
      .where(eq(modelCosts.isActive, "true"));

    const [modelCostAvg] = await db
      .select({ avg: avg(modelCosts.credits) })
      .from(modelCosts)
      .where(eq(modelCosts.isActive, "true"));

    // Processar dados
    const reservationsByStatus = reservationStats.reduce((acc, item) => {
      acc[item.status as ReservationStatus] = item.count;
      return acc;
    }, {} as Record<ReservationStatus, number>);

    const transactionsByTypeMap = transactionsByType.reduce((acc, item) => {
      acc[item.type as TransactionType] = item.count;
      return acc;
    }, {} as Record<TransactionType, number>);

    return {
      users: {
        total: usersTotal.count,
        withCredits: usersWithCredits.count,
        averageBalance: Number(balanceStats.avg) || 0,
        totalBalance: Number(balanceStats.total) || 0
      },
      reservations: {
        total: reservationsTotal.count,
        pending: reservationsByStatus[ReservationStatus.PENDING] || 0,
        confirmed: reservationsByStatus[ReservationStatus.CONFIRMED] || 0,
        cancelled: reservationsByStatus[ReservationStatus.CANCELLED] || 0,
        expired: reservationsByStatus[ReservationStatus.EXPIRED] || 0
      },
      transactions: {
        total: transactionsTotal.count,
        totalVolume: Number(transactionVolume.total) || 0,
        byType: {
          [TransactionType.EARNED]: transactionsByTypeMap[TransactionType.EARNED] || 0,
          [TransactionType.SPENT]: transactionsByTypeMap[TransactionType.SPENT] || 0,
          [TransactionType.REFUND]: transactionsByTypeMap[TransactionType.REFUND] || 0,
          [TransactionType.BONUS]: transactionsByTypeMap[TransactionType.BONUS] || 0
        }
      },
      models: {
        total: modelsTotal.count,
        active: modelsActive.count,
        averageCost: Number(modelCostAvg.avg) || 0
      }
    };
  }

  /**
   * Obtém métricas de saúde do sistema
   */
  static async getHealthMetrics(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    metrics: {
      expiredReservationsCount: number;
      pendingReservationsOlderThan1Hour: number;
      usersWithNegativeBalance: number;
      inconsistentBalances: number;
      failureRate: number;
    };
  }> {
    const issues: string[] = [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Reservas expiradas
    const [expiredReservations] = await db
      .select({ count: count() })
      .from(creditReservations)
      .where(
        and(
          eq(creditReservations.status, "pending"),
          lte(creditReservations.expiresAt, now)
        )
      );

    // Reservas pendentes há mais de 1 hora
    const [oldPendingReservations] = await db
      .select({ count: count() })
      .from(creditReservations)
      .where(
        and(
          eq(creditReservations.status, "pending"),
          lte(creditReservations.createdAt, oneHourAgo)
        )
      );

    // Usuários com saldo negativo
    const [negativeBalanceUsers] = await db
      .select({ count: count() })
      .from(userCredits)
      .where(sql`${userCredits.balance} < 0`);

    // Verificar consistência de saldos
    const inconsistentBalances = await db
      .select({
        userId: userCredits.userId,
        balance: userCredits.balance,
        totalEarned: userCredits.totalEarned,
        totalSpent: userCredits.totalSpent
      })
      .from(userCredits)
      .where(
        sql`${userCredits.balance} != (${userCredits.totalEarned} - ${userCredits.totalSpent})`
      );

    // Taxa de falha (transações de reembolso vs gastos nas últimas 24h)
    const [recentSpent] = await db
      .select({ count: count() })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.type, "spent"),
          gte(creditTransactions.createdAt, oneDayAgo)
        )
      );

    const [recentRefunds] = await db
      .select({ count: count() })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.type, "refund"),
          gte(creditTransactions.createdAt, oneDayAgo)
        )
      );

    const failureRate = recentSpent.count > 0 ? (recentRefunds.count / recentSpent.count) * 100 : 0;

    // Avaliar problemas
    if (expiredReservations.count > 0) {
      issues.push(`${expiredReservations.count} reservas expiradas não limpas`);
    }

    if (oldPendingReservations.count > 10) {
      issues.push(`${oldPendingReservations.count} reservas pendentes há mais de 1 hora`);
    }

    if (negativeBalanceUsers.count > 0) {
      issues.push(`${negativeBalanceUsers.count} usuários com saldo negativo`);
    }

    if (inconsistentBalances.length > 0) {
      issues.push(`${inconsistentBalances.length} usuários com saldos inconsistentes`);
    }

    if (failureRate > 20) {
      issues.push(`Taxa de falha alta: ${failureRate.toFixed(1)}%`);
    }

    // Determinar status geral
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (negativeBalanceUsers.count > 0 || inconsistentBalances.length > 0) {
      status = 'critical';
    } else if (issues.length > 0) {
      status = 'warning';
    }

    return {
      status,
      issues,
      metrics: {
        expiredReservationsCount: expiredReservations.count,
        pendingReservationsOlderThan1Hour: oldPendingReservations.count,
        usersWithNegativeBalance: negativeBalanceUsers.count,
        inconsistentBalances: inconsistentBalances.length,
        failureRate: Number(failureRate.toFixed(2))
      }
    };
  }

  /**
   * Obtém métricas de uso por período
   */
  static async getUsageMetrics(period: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<{
    period: string;
    transactions: Array<{
      date: string;
      spent: number;
      earned: number;
      refunded: number;
      count: number;
    }>;
    reservations: Array<{
      date: string;
      created: number;
      confirmed: number;
      cancelled: number;
    }>;
  }> {
    const now = new Date();
    let startDate: Date;
    let dateFormat: string;

    switch (period) {
      case 'hour':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Últimas 24 horas
        dateFormat = 'YYYY-MM-DD HH24:00:00';
        break;
      case 'day':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Últimos 30 dias
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // Últimas 12 semanas
        dateFormat = 'YYYY-"W"WW';
        break;
      case 'month':
        startDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000); // Últimos 12 meses
        dateFormat = 'YYYY-MM';
        break;
    }

    // Métricas de transações
    const transactionMetrics = await db
      .select({
        date: sql.raw(`TO_CHAR(${creditTransactions.createdAt.name}, '${dateFormat}')`),
        type: creditTransactions.type,
        amount: sum(sql`ABS(${creditTransactions.amount})`),
        count: count()
      })
      .from(creditTransactions)
      .where(gte(creditTransactions.createdAt, startDate))
      .groupBy(
        sql.raw(`TO_CHAR(${creditTransactions.createdAt.name}, '${dateFormat}')`),
        creditTransactions.type
      )
      .orderBy(sql.raw(`TO_CHAR(${creditTransactions.createdAt.name}, '${dateFormat}')`))
      .catch(error => {
        console.error('Error in transaction metrics query:', error);
        return [];
      });

    // Métricas de reservas
    const reservationMetrics = await db
      .select({
        date: sql.raw(`TO_CHAR(${creditReservations.createdAt.name}, '${dateFormat}')`),
        status: creditReservations.status,
        count: count()
      })
      .from(creditReservations)
      .where(gte(creditReservations.createdAt, startDate))
      .groupBy(
        sql.raw(`TO_CHAR(${creditReservations.createdAt.name}, '${dateFormat}')`),
        creditReservations.status
      )
      .orderBy(sql.raw(`TO_CHAR(${creditReservations.createdAt.name}, '${dateFormat}')`))
      .catch(error => {
        console.error('Error in reservation metrics query:', error);
        return [];
      });

    // Processar dados de transações
    const transactionsByDate = transactionMetrics.reduce((acc, item) => {
      const date = item.date as string;
      if (!acc[date]) {
        acc[date] = { date, spent: 0, earned: 0, refunded: 0, count: 0 };
      }

      const amount = Number(item.amount) || 0;
      const count = item.count;

      switch (item.type) {
        case 'spent':
          acc[date].spent += amount;
          break;
        case 'earned':
        case 'bonus':
          acc[date].earned += amount;
          break;
        case 'refund':
          acc[date].refunded += amount;
          break;
      }

      acc[date].count += count;
      return acc;
    }, {} as Record<string, any>);

    // Processar dados de reservas
    const reservationsByDate = reservationMetrics.reduce((acc, item) => {
      const date = item.date as string;
      if (!acc[date]) {
        acc[date] = { date, created: 0, confirmed: 0, cancelled: 0 };
      }

      const count = item.count;

      switch (item.status) {
        case 'pending':
          acc[date].created += count;
          break;
        case 'confirmed':
          acc[date].confirmed += count;
          break;
        case 'cancelled':
          acc[date].cancelled += count;
          break;
      }

      return acc;
    }, {} as Record<string, any>);

    return {
      period,
      transactions: Object.values(transactionsByDate),
      reservations: Object.values(reservationsByDate)
    };
  }

  /**
   * Obtém top usuários por uso de créditos
   */
  static async getTopUsers(limit: number = 10): Promise<Array<{
    userId: string;
    totalSpent: number;
    totalEarned: number;
    balance: number;
    transactionCount: number;
    lastActivity: Date;
  }>> {
    const topUsers = await db
      .select({
        userId: userCredits.userId,
        totalSpent: userCredits.totalSpent,
        totalEarned: userCredits.totalEarned,
        balance: userCredits.balance,
        transactionCount: count(creditTransactions.id),
        lastActivity: sql`MAX(${creditTransactions.createdAt})`
      })
      .from(userCredits)
      .leftJoin(creditTransactions, eq(userCredits.userId, creditTransactions.userId))
      .groupBy(
        userCredits.userId,
        userCredits.totalSpent,
        userCredits.totalEarned,
        userCredits.balance
      )
      .orderBy(desc(userCredits.totalSpent))
      .limit(limit);

    return topUsers.map(user => ({
      ...user,
      lastActivity: user.lastActivity as Date
    }));
  }

  /**
   * Obtém estatísticas de modelos mais usados
   */
  static async getModelUsageStats(): Promise<Array<{
    modelId: string;
    modelName: string;
    credits: number;
    usageCount: number;
    totalCreditsSpent: number;
    isActive: boolean;
  }>> {
    const modelStats = await db
      .select({
        modelId: modelCosts.modelId,
        modelName: modelCosts.modelName,
        credits: modelCosts.credits,
        isActive: modelCosts.isActive,
        usageCount: count(creditReservations.id),
        totalCreditsSpent: sum(creditReservations.amount)
      })
      .from(modelCosts)
      .leftJoin(creditReservations, eq(modelCosts.modelId, creditReservations.modelId))
      .groupBy(
        modelCosts.modelId,
        modelCosts.modelName,
        modelCosts.credits,
        modelCosts.isActive
      )
      .orderBy(desc(count(creditReservations.id)));

    return modelStats.map(stat => ({
      ...stat,
      isActive: stat.isActive === "true",
      totalCreditsSpent: Number(stat.totalCreditsSpent) || 0
    }));
  }
}