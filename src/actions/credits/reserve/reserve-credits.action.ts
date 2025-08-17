"use server";

import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

import { db } from "@/db";
import { authActionClient } from "@/lib/safe-action";
import { userCredits, modelCosts, creditReservations } from "@/db/schema";

import { reserveCreditsSchema } from "./reserve-credits.action.schema";

export const reserveCredits = authActionClient
  .inputSchema(reserveCreditsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx as { userId: string };
    const { modelId, description } = parsedInput;

    try {
      // Obter custo do modelo
      const [modelCost] = await db
        .select()
        .from(modelCosts)
        .where(
          and(eq(modelCosts.modelId, modelId), eq(modelCosts.isActive, "true"))
        )
        .limit(1);

      if (!modelCost) {
        return {
          success: false,
          errors: {
            _form: [`Modelo ${modelId} não encontrado`],
          },
        };
      }

      // Verificar se tem créditos suficientes
      const [userCredit] = await db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userId))
        .limit(1);

      const currentBalance = userCredit?.balance
        ? userCredit?.balance
        : userCredit?.freeCreditsBalance ?? 0;
      if (currentBalance < modelCost.credits) {
        return {
          success: false,
          errors: {
            _form: ["Créditos insuficientes"],
          },
        };
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
        success: true,
        data: {
          reservationId,
          cost: modelCost.credits,
        },
      };
    } catch (error) {
      return {
        success: false,
        errors: {
          _form: [
            error instanceof Error ? error.message : "Erro interno do servidor",
          ],
        },
      };
    }
  });
