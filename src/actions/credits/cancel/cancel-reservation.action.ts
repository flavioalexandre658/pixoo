"use server";

import { eq, and } from "drizzle-orm";

import { db } from "@/db";
import { authActionClient } from "@/lib/safe-action";
import { creditReservations } from "@/db/schema";

import { cancelReservationWebhookSchema } from "./cancel-reservation-webhook.action.schema";

export const cancelReservation = authActionClient
  .inputSchema(cancelReservationWebhookSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { reservationId, reason } = parsedInput;
    const { userId } = ctx as { userId: string };

    try {
      console.log(`🔄 Iniciando cancelamento de reserva:`, {
        userId,
        reservationId,
        reason,
        timestamp: new Date().toISOString(),
      });

      // Verificar se a reserva existe e pertence ao usuário
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
        console.error(`❌ Reserva não encontrada para cancelamento:`, {
          reservationId,
          userId,
          timestamp: new Date().toISOString(),
        });
        return {
          success: false,
          errors: {
            _form: ["Reserva não encontrada"],
          },
        };
      }

      // Verificar se a reserva já foi cancelada (idempotência)
      if (reservation.status === "cancelled") {
        console.log(`ℹ️ Reserva já cancelada:`, {
          reservationId,
          userId,
          timestamp: new Date().toISOString(),
        });
        return {
          success: true,
          data: {
            message: "Reserva já foi cancelada anteriormente",
            reservationId,
            alreadyCancelled: true,
          },
        };
      }

      // Não permitir cancelamento de reservas já confirmadas
      if (reservation.status === "confirmed") {
        console.error(`❌ Tentativa de cancelar reserva já confirmada:`, {
          reservationId,
          userId,
          timestamp: new Date().toISOString(),
        });
        return {
          success: false,
          errors: {
            _form: ["Não é possível cancelar uma reserva já confirmada"],
          },
        };
      }

      // Atualizar status da reserva para 'cancelled'
      await db
        .update(creditReservations)
        .set({
          status: "cancelled",
          description: reason || "Cancelado devido a erro na geração",
          updatedAt: new Date(),
        })
        .where(eq(creditReservations.id, reservationId));

      console.log(`✅ Reserva cancelada com sucesso:`, {
        userId,
        reservationId,
        reason,
        amount: reservation.amount,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        data: {
          message: "Reserva cancelada com sucesso",
          reservationId,
          amount: reservation.amount,
          reason: reason || "Cancelado devido a erro na geração",
        },
      };
    } catch (error) {
      console.error(`❌ Erro ao cancelar reserva:`, {
        userId,
        reservationId,
        reason,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      });

      return {
        success: false,
        errors: {
          _form: ["Erro interno ao cancelar reserva"],
        },
      };
    }
  });
