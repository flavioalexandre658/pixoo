import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schemas from "../db/schema";
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
        after: async (user) => {
          try {
            // Criar registro de créditos iniciais para novos usuários
            await db.insert(schemas.userCredits).values({
              id: crypto.randomUUID(),
              userId: user.id,
              balance: 10, // Usar balance em vez de freeCreditsBalance
              totalEarned: 10,
              totalSpent: 0,
            });

            // Registrar transação inicial
            await db.insert(schemas.creditTransactions).values({
              id: crypto.randomUUID(),
              userId: user.id,
              type: "bonus",
              amount: 10,
              description: "Créditos gratuitos de boas-vindas - Pixoo Init",
              balanceAfter: 10, // Balance após adição
              metadata: JSON.stringify({
                balance: 10, // Usar balance no metadata
                initialCredits: true,
              }),
              createdAt: new Date(),
            });

            console.log(
              `✅ Créditos gratuitos iniciais criados para usuário ${user.id}`
            );
          } catch (error) {
            console.error(
              `❌ Erro ao criar créditos iniciais para usuário ${user.id}:`,
              error
            );
            // Não lançar erro para não quebrar o fluxo de criação do usuário
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
