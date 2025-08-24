import { db } from "@/db";
import { ipRateLimits } from "@/db/schema";
import { eq } from "drizzle-orm";
import { securityLogger } from "@/services/security/security-logger.service";

interface CheckRateLimitParams {
  ipAddress: string;
  userAgent: string;
  fingerprint?: string;
  email: string;
}

interface CheckRateLimitResult {
  allowed: boolean;
  reason?: string;
  remainingAttempts?: number;
}

export async function checkRateLimitService(data: CheckRateLimitParams): Promise<CheckRateLimitResult> {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Verificar se o IP está bloqueado
    const ipLimit = await db
      .select()
      .from(ipRateLimits)
      .where(eq(ipRateLimits.ipAddress, data.ipAddress))
      .limit(1);

    if (ipLimit.length > 0) {
      const limit = ipLimit[0];

      // Verificar se está bloqueado temporariamente
      if (limit.isBlocked && limit.blockedUntil && limit.blockedUntil > now) {
        await securityLogger.logSecurityEvent({
          eventType: 'rate_limit_exceeded',
          severity: 'medium',
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          fingerprint: data.fingerprint,
          email: data.email,
          description: 'Tentativa de acesso com IP bloqueado',
          metadata: {
            blockedUntil: limit.blockedUntil.toISOString(),
            reason: limit.blockReason,
          },
        });

        return {
          allowed: false,
          reason: `IP bloqueado até ${limit.blockedUntil.toLocaleString()}. Motivo: ${limit.blockReason}`,
        };
      }

      // Verificar limite diário (máximo 2 contas por IP por dia)
      const dailyLimit = 2;
      if (limit.lastAccountCreation && limit.lastAccountCreation >= todayStart) {
        if (limit.accountCreationCount >= dailyLimit) {
          // Bloquear IP por 24 horas
          const blockedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);

          await db
            .update(ipRateLimits)
            .set({
              isBlocked: true,
              blockedUntil,
              blockReason: 'Limite diário de criação de contas excedido',
              updatedAt: now,
            })
            .where(eq(ipRateLimits.ipAddress, data.ipAddress));

          await securityLogger.logSecurityEvent({
            eventType: 'rate_limit_exceeded',
            severity: 'high',
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            fingerprint: data.fingerprint,
            email: data.email,
            description: 'IP bloqueado por exceder limite diário de criação de contas',
            metadata: {
              dailyCount: limit.accountCreationCount,
              dailyLimit,
              blockedUntil: blockedUntil.toISOString(),
            },
          });

          return {
            allowed: false,
            reason: 'Limite diário de criação de contas excedido. Tente novamente amanhã.',
          };
        }

        return {
          allowed: true,
          remainingAttempts: dailyLimit - limit.accountCreationCount,
        };
      }
    }

    // IP não tem limitações, permitir criação
    return {
      allowed: true,
      remainingAttempts: 2,
    };
  } catch (error) {
    console.error('Erro ao verificar rate limit:', error);
    // Em caso de erro, permitir a criação para não bloquear usuários legítimos
    return {
      allowed: true,
    };
  }
}