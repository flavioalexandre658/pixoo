"use server";

import { actionClient } from '@/lib/safe-action';
import { getSecurityLogsSchema, GetSecurityLogsInput } from "./get-security-logs.schema";
import { db } from "@/db";
import { securityLogs } from "@/db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

interface GetSecurityLogsResult {
  logs: Array<{
    id: string;
    eventType: string;
    severity: string;
    ipAddress: string;
    userAgent: string;
    fingerprint?: string;
    userId?: string;
    email?: string;
    description: string;
    metadata?: any;
    isResolved: boolean;
    resolvedBy?: string;
    resolvedAt?: Date;
    createdAt: Date;
  }>;
  total: number;
}

const handler = async (data: GetSecurityLogsInput): Promise<GetSecurityLogsResult> => {
  try {
    // Construir condições de filtro
    const conditions = [];

    if (data.eventType) {
      conditions.push(eq(securityLogs.eventType, data.eventType));
    }

    if (data.severity) {
      conditions.push(eq(securityLogs.severity, data.severity));
    }

    if (data.ipAddress) {
      conditions.push(eq(securityLogs.ipAddress, data.ipAddress));
    }

    if (data.startDate) {
      conditions.push(gte(securityLogs.createdAt, new Date(data.startDate)));
    }

    if (data.endDate) {
      conditions.push(lte(securityLogs.createdAt, new Date(data.endDate)));
    }

    // Construir query com filtros
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Obter logs com filtros aplicados
    const logs = await db
      .select()
      .from(securityLogs)
      .where(whereClause)
      .orderBy(desc(securityLogs.createdAt))
      .limit(data.limit || 50);

    // Contar total de registros (para paginação futura)
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(securityLogs)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    return {
      logs: logs.map(log => ({
        id: log.id,
        eventType: log.eventType,
        severity: log.severity,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        fingerprint: log.fingerprint || undefined,
        userId: log.userId || undefined,
        email: log.email || undefined,
        description: log.description,
        metadata: log.metadata ? JSON.parse(log.metadata as string) : undefined,
        isResolved: log.isResolved,
        resolvedBy: log.resolvedBy || undefined,
        resolvedAt: log.resolvedAt || undefined,
        createdAt: log.createdAt,
      })),
      total,
    };
  } catch (error) {
    console.error("Erro ao obter logs de segurança:", error);
    throw new Error("Erro interno do servidor");
  }
};

export const getSecurityLogs = actionClient.inputSchema(getSecurityLogsSchema).action(async ({ parsedInput }) => {
  return await handler(parsedInput);
});