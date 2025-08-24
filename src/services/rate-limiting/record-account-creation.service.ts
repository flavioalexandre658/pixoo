import { db } from "@/db";
import { ipRateLimits, accountCreationAttempts } from "@/db/schema";
import { sql } from "drizzle-orm";
import { securityLogger } from "@/services/security/security-logger.service";

interface RecordAccountCreationParams {
  ipAddress: string;
  userAgent: string;
  fingerprint?: string;
  email: string;
  userId: string;
}

export async function recordAccountCreationService(data: RecordAccountCreationParams): Promise<void> {
  try {
    const now = new Date();

    // Atualizar ou criar registro de rate limit para o IP
    await db
      .insert(ipRateLimits)
      .values({
        ipAddress: data.ipAddress,
        accountCreationCount: 1,
        lastAccountCreation: now,
        isBlocked: false,
        blockedUntil: null,
      })
      .onConflictDoUpdate({
        target: ipRateLimits.ipAddress,
        set: {
          accountCreationCount: sql`${ipRateLimits.accountCreationCount} + 1`,
          lastAccountCreation: now,
          updatedAt: now,
        },
      });

    // Registrar tentativa de criação de conta
    await db
      .insert(accountCreationAttempts)
      .values({
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        fingerprint: data.fingerprint,
        email: data.email,
        success: true,
      });

    // Registrar evento de segurança
    await securityLogger.logSecurityEvent({
      eventType: 'account_creation',
      severity: 'low',
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      fingerprint: data.fingerprint,
      userId: data.userId,
      email: data.email,
      description: 'Conta criada com sucesso',
      metadata: {
        timestamp: now.toISOString(),
      },
    });

    // Detectar padrões suspeitos
    await securityLogger.detectSuspiciousPatterns(data.ipAddress, data.fingerprint);
  } catch (error) {
    console.error('Erro ao registrar criação de conta:', error);
    throw error;
  }
}