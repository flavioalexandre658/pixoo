"use server";

import { actionClient } from "@/lib/safe-action";
import { checkRateLimitSchema, CheckRateLimitInput } from "./check-rate-limit.schema";
import { db } from "@/db";
import { ipRateLimits, accountCreationAttempts } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { headers } from "next/headers";
import { securityLogger } from "@/services/security/security-logger.service";

interface CheckRateLimitResult {
  allowed: boolean;
  reason?: string;
  remainingAttempts?: number;
  resetTime?: Date;
}

// Configurações de rate limiting
const RATE_LIMIT_CONFIG = {
  MAX_ACCOUNTS_PER_IP_PER_DAY: 3, // Máximo 3 contas por IP por dia
  MAX_ACCOUNTS_PER_IP_TOTAL: 5, // Máximo 5 contas por IP total
  BLOCK_DURATION_HOURS: 24, // Bloquear por 24 horas após exceder limite
  SUSPICIOUS_THRESHOLD: 10, // Tentativas suspeitas em 1 hora
};

const handler = async (data: CheckRateLimitInput): Promise<CheckRateLimitResult> => {
  try {
    // Obter IP real da requisição
    const headersList = await headers();
    const realIP = headersList.get('x-real-client-ip') || 
                   headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   headersList.get('x-real-ip') || 
                   data.ipAddress;

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Verificar se o IP está bloqueado
    const ipLimit = await db
      .select()
      .from(ipRateLimits)
      .where(eq(ipRateLimits.ipAddress, realIP))
      .limit(1);

    if (ipLimit.length > 0) {
      const limit = ipLimit[0];
      
      // Verificar se o IP está bloqueado
      if (limit.isBlocked && limit.blockedUntil && limit.blockedUntil > now) {
        // Log da tentativa de acesso com IP bloqueado
        await securityLogger.logSecurityEvent({
          eventType: 'rate_limit_exceeded',
          severity: 'medium',
          ipAddress: realIP,
          userAgent: data.userAgent,
          fingerprint: data.fingerprint,
          description: `Tentativa de acesso com IP bloqueado até ${limit.blockedUntil.toLocaleString('pt-BR')}`,
          metadata: {
            blockReason: limit.blockReason,
            blockedUntil: limit.blockedUntil.toISOString(),
          },
        });

        return {
          allowed: false,
          reason: `IP bloqueado até ${limit.blockedUntil.toLocaleString('pt-BR')}. Motivo: ${limit.blockReason}`,
          resetTime: limit.blockedUntil,
        };
      }
      
      // Verificar limite diário
      if (limit.lastAccountCreation && limit.lastAccountCreation > oneDayAgo) {
        if (limit.accountCreationCount >= RATE_LIMIT_CONFIG.MAX_ACCOUNTS_PER_IP_PER_DAY) {
          // Bloquear IP por exceder limite diário
          const blockedUntil = new Date(now.getTime() + RATE_LIMIT_CONFIG.BLOCK_DURATION_HOURS * 60 * 60 * 1000);
          
          await db
            .update(ipRateLimits)
            .set({
              isBlocked: true,
              blockedUntil,
              blockReason: "Excedeu limite de criação de contas por dia",
              updatedAt: now,
            })
            .where(eq(ipRateLimits.id, limit.id));

          // Log do bloqueio por excesso de criação de contas
          await securityLogger.logSecurityEvent({
            eventType: 'rate_limit_exceeded',
            severity: 'high',
            ipAddress: realIP,
            userAgent: data.userAgent,
            fingerprint: data.fingerprint,
            email: data.email,
            description: `IP bloqueado por exceder limite diário de criação de contas (${limit.accountCreationCount} contas)`,
            metadata: {
              accountCount: limit.accountCreationCount,
              limit: RATE_LIMIT_CONFIG.MAX_ACCOUNTS_PER_IP_PER_DAY,
              blockedUntil: blockedUntil.toISOString(),
            },
          });

          return {
            allowed: false,
            reason: "Limite de criação de contas excedido para hoje. Tente novamente amanhã.",
            resetTime: blockedUntil,
          };
        }
      }
    }

    // Verificar tentativas suspeitas na última hora
    const recentAttempts = await db
      .select()
      .from(accountCreationAttempts)
      .where(
        and(
          eq(accountCreationAttempts.ipAddress, realIP),
          gte(accountCreationAttempts.lastAttemptAt, oneHourAgo)
        )
      );

    if (recentAttempts.length >= RATE_LIMIT_CONFIG.SUSPICIOUS_THRESHOLD) {
      // Bloquear por atividade suspeita
      const blockedUntil = new Date(now.getTime() + RATE_LIMIT_CONFIG.BLOCK_DURATION_HOURS * 60 * 60 * 1000);
      
      await db
        .insert(ipRateLimits)
        .values({
          ipAddress: realIP,
          accountCreationCount: 0,
          isBlocked: true,
          blockedUntil,
          blockReason: "Atividade suspeita detectada - muitas tentativas em pouco tempo",
        })
        .onConflictDoUpdate({
          target: ipRateLimits.ipAddress,
          set: {
            isBlocked: true,
            blockedUntil,
            blockReason: "Atividade suspeita detectada - muitas tentativas em pouco tempo",
            updatedAt: now,
          },
        });

      return {
        allowed: false,
        reason: "Atividade suspeita detectada. Conta temporariamente bloqueada.",
        resetTime: blockedUntil,
      };
    }

    // Registrar tentativa
    await db
      .insert(accountCreationAttempts)
      .values({
        ipAddress: realIP,
        userAgent: data.userAgent,
        fingerprint: data.fingerprint,
        email: data.email,
        success: false, // Será atualizado para true se a criação for bem-sucedida
      });

    const remainingAttempts = Math.max(0, RATE_LIMIT_CONFIG.MAX_ACCOUNTS_PER_IP_PER_DAY - (ipLimit[0]?.accountCreationCount || 0));

    return {
      allowed: true,
      remainingAttempts,
    };
  } catch (error) {
    console.error("Erro ao verificar rate limit:", error);
    // Em caso de erro, permitir a criação para não bloquear usuários legítimos
    return {
      allowed: true,
      reason: "Erro interno - verificação de rate limit falhou",
    };
  }
};

export const checkRateLimit = actionClient.inputSchema(checkRateLimitSchema).action(async ({ parsedInput }) => {
  return await handler(parsedInput);
});