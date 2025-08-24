"use server";

import { actionClient } from "@/lib/safe-action";
import { recordAccountCreationSchema, RecordAccountCreationInput } from "./record-account-creation.schema";
import { db } from "@/db";
import { ipRateLimits, accountCreationAttempts } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { securityLogger } from "@/services/security/security-logger.service";

interface RecordAccountCreationResult {
  success: boolean;
  message: string;
}

const handler = async (data: RecordAccountCreationInput): Promise<RecordAccountCreationResult> => {
  try {
    // Obter IP real da requisição
    const headersList = await headers();
    const realIP = headersList.get('x-real-client-ip') || 
                   headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   headersList.get('x-real-ip') || 
                   data.ipAddress;

    const now = new Date();

    // Atualizar ou criar registro de rate limit para o IP
    await db
      .insert(ipRateLimits)
      .values({
        ipAddress: realIP,
        accountCreationCount: 1,
        lastAccountCreation: now,
        isBlocked: false,
      })
      .onConflictDoUpdate({
        target: ipRateLimits.ipAddress,
        set: {
          accountCreationCount: sql`${ipRateLimits.accountCreationCount} + 1`,
          lastAccountCreation: now,
          updatedAt: now,
        },
      });

    // Marcar a tentativa mais recente como bem-sucedida
    const recentAttempt = await db
      .select()
      .from(accountCreationAttempts)
      .where(
        and(
          eq(accountCreationAttempts.ipAddress, realIP),
          eq(accountCreationAttempts.email, data.email)
        )
      )
      .orderBy(desc(accountCreationAttempts.createdAt))
      .limit(1);

    if (recentAttempt.length > 0) {
      await db
        .update(accountCreationAttempts)
        .set({
          success: true,
          lastAttemptAt: now,
        })
        .where(eq(accountCreationAttempts.id, recentAttempt[0].id));
    }

    // Log da criação de conta bem-sucedida
    await securityLogger.logSecurityEvent({
      eventType: 'account_creation',
      severity: 'low',
      ipAddress: realIP,
      userAgent: data.userAgent,
      fingerprint: data.fingerprint,
      userId: data.userId,
      email: data.email,
      description: `Conta criada com sucesso para ${data.email}`,
      metadata: {
        userId: data.userId,
        creationMethod: 'standard',
      },
    });

    // Detectar padrões suspeitos após criação da conta
    await securityLogger.detectSuspiciousPatterns(realIP, data.fingerprint);

    return {
      success: true,
      message: "Criação de conta registrada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao registrar criação de conta:", error);
    return {
      success: false,
      message: "Erro ao registrar criação de conta",
    };
  }
};

export const recordAccountCreation = actionClient.inputSchema(recordAccountCreationSchema).action(async ({ parsedInput }) => {
  return await handler(parsedInput);
});