import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schemas from "../db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimitService } from "@/services/rate-limiting/check-rate-limit.service";
import { recordAccountCreationService } from "@/services/rate-limiting/record-account-creation.service";
export const auth = betterAuth({
  trustedOrigins: [
    "http://localhost:3000",
    "https://pixooai.com",
    process.env.NEXT_PUBLIC_APP_URL || "https://pixooai.com"
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: schemas,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          try {
            // Obter dados da requisição para rate limiting
            const userAgent = context?.request?.headers.get('user-agent') || 'unknown';
            const realIP = context?.request?.headers.get('x-real-client-ip') ||
              context?.request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
              context?.request?.headers.get('x-real-ip') ||
              'unknown';
            const fingerprintId = context?.request?.headers.get('x-device-fingerprint-id');

            // Verificar rate limiting
            const rateLimitResult = await checkRateLimitService({
              ipAddress: realIP,
              userAgent,
              fingerprint: fingerprintId || undefined,
              email: user.email,
            });

            if (!rateLimitResult.allowed) {
              throw new Error(rateLimitResult.reason || 'Rate limit excedido');
            }
          } catch (error) {
            console.error('Erro na verificação de rate limit:', error);
            throw error;
          }
        },
        after: async (user, context) => {
          try {
            // Obter dados da requisição
            const userAgent = context?.request?.headers.get('user-agent') || 'unknown';
            const realIP = context?.request?.headers.get('x-real-client-ip') ||
              context?.request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
              context?.request?.headers.get('x-real-ip') ||
              'unknown';
            const fingerprintId = context?.request?.headers.get('x-device-fingerprint-id');

            // Registrar criação de conta bem-sucedida
            await recordAccountCreationService({
              ipAddress: realIP,
              userAgent,
              fingerprint: fingerprintId || undefined,
              email: user.email,
              userId: user.id,
            });

            // Verificar se há um fingerprint válido no contexto da requisição
            let shouldReceiveCredits = true;

            if (fingerprintId) {
              // Verificar se este dispositivo já recebeu créditos
              const existingFingerprint = await db
                .select()
                .from(schemas.deviceFingerprints)
                .where(eq(schemas.deviceFingerprints.id, fingerprintId))
                .limit(1);

              if (existingFingerprint.length > 0 && existingFingerprint[0].hasReceivedCredits) {
                shouldReceiveCredits = false;
                console.log(
                  `⚠️ Dispositivo ${fingerprintId} já recebeu créditos gratuitos. Usuário ${user.id} não receberá créditos iniciais.`
                );
              }
            }

            if (shouldReceiveCredits) {
              // Criar registro de créditos iniciais para novos usuários
              await db.insert(schemas.userCredits).values({
                id: crypto.randomUUID(),
                userId: user.id,
                balance: 4, // Usar balance em vez de freeCreditsBalance
                totalEarned: 4,
                totalSpent: 0,
              });

              // Registrar transação inicial
              await db.insert(schemas.creditTransactions).values({
                id: crypto.randomUUID(),
                userId: user.id,
                type: "bonus",
                amount: 4,
                description: "Créditos gratuitos de boas-vindas - Pixoo Init",
                balanceAfter: 4, // Balance após adição
                metadata: JSON.stringify({
                  balance: 4, // Usar balance no metadata
                  initialCredits: true,
                  fingerprintId: fingerprintId || null,
                }),
                createdAt: new Date(),
              });

              // Marcar o dispositivo como tendo recebido créditos se fingerprintId existir
              if (fingerprintId) {
                await db
                  .update(schemas.deviceFingerprints)
                  .set({
                    hasReceivedCredits: true,
                    firstUserId: user.id,
                  })
                  .where(eq(schemas.deviceFingerprints.id, fingerprintId));

                // Registrar a associação entre dispositivo e usuário
                await db.insert(schemas.deviceFingerprintUsers).values({
                  deviceFingerprintId: fingerprintId,
                  userId: user.id,
                });
              }

              console.log(
                `✅ Créditos gratuitos iniciais criados para usuário ${user.id}`
              );
            } else {
              // Criar registro de créditos sem saldo inicial
              await db.insert(schemas.userCredits).values({
                id: crypto.randomUUID(),
                userId: user.id,
                balance: 0,
                totalEarned: 0,
                totalSpent: 0,
              });

              console.log(
                `ℹ️ Usuário ${user.id} criado sem créditos iniciais (dispositivo já usado)`
              );
            }
          } catch (error) {
            console.error(
              `❌ Erro ao criar créditos iniciais para usuário ${user.id}:`,
              error
            );
            // Criar pelo menos o registro de créditos vazio para não quebrar o sistema
            try {
              await db.insert(schemas.userCredits).values({
                id: crypto.randomUUID(),
                userId: user.id,
                balance: 0,
                totalEarned: 0,
                totalSpent: 0,
              });
            } catch (fallbackError) {
              console.error(
                `❌ Erro crítico ao criar registro de créditos para usuário ${user.id}:`,
                fallbackError
              );
            }
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
