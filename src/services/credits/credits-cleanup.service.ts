import { db } from "../../../db";
import { creditReservations } from "../../../db/schema";
import { eq, and, lt } from "drizzle-orm";

/**
 * Serviço dedicado para limpeza de reservas de crédito
 * Separado da lógica principal para evitar interferências
 */
export class CreditsCleanupService {
  private static lastCleanup: Date | null = null;
  private static readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
  private static readonly BATCH_SIZE = 100;

  /**
   * Limpa reservas expiradas (status pending e expiresAt < now)
   */
  static async cleanupExpiredReservations(): Promise<{
    cancelled: number;
    errors: string[];
  }> {
    const now = new Date();
    const errors: string[] = [];
    let totalCancelled = 0;

    try {
      console.log(`🧹 Iniciando limpeza de reservas expiradas: ${now.toISOString()}`);

      // Buscar reservas expiradas em lotes
      let hasMore = true;
      let offset = 0;

      while (hasMore) {
        const expiredReservations = await db
          .select()
          .from(creditReservations)
          .where(
            and(
              eq(creditReservations.status, "pending"),
              lt(creditReservations.expiresAt, now)
            )
          )
          .limit(this.BATCH_SIZE)
          .offset(offset);

        if (expiredReservations.length === 0) {
          hasMore = false;
          break;
        }

        // Cancelar este lote
        const reservationIds = expiredReservations.map(r => r.id);
        
        try {
          await db
            .update(creditReservations)
            .set({ 
              status: "cancelled", 
              updatedAt: now,
              description: `${expiredReservations[0]?.description || 'Reserva'} (cancelada por expiração)`
            })
            .where(
              and(
                eq(creditReservations.status, "pending"),
                lt(creditReservations.expiresAt, now)
              )
            );

          totalCancelled += expiredReservations.length;
          console.log(`✅ Lote cancelado: ${expiredReservations.length} reservas`);
        } catch (batchError) {
          const errorMsg = `Erro ao cancelar lote de ${expiredReservations.length} reservas: ${batchError}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }

        offset += this.BATCH_SIZE;
        
        // Evitar loops infinitos
        if (offset > 10000) {
          errors.push("Limite de segurança atingido (10000 registros)");
          break;
        }
      }

      this.lastCleanup = now;
      
      console.log(`✅ Limpeza concluída: ${totalCancelled} reservas canceladas, ${errors.length} erros`);
      
      return {
        cancelled: totalCancelled,
        errors
      };
    } catch (error) {
      const errorMsg = `Erro geral na limpeza: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
      
      return {
        cancelled: totalCancelled,
        errors
      };
    }
  }

  /**
   * Remove reservas muito antigas (confirmadas ou canceladas há mais de 30 dias)
   */
  static async cleanupOldReservations(): Promise<{
    deleted: number;
    errors: string[];
  }> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const errors: string[] = [];
    let totalDeleted = 0;

    try {
      console.log(`🗑️ Iniciando limpeza de reservas antigas (antes de ${thirtyDaysAgo.toISOString()})`);

      // Buscar reservas antigas em lotes
      let hasMore = true;
      let offset = 0;

      while (hasMore) {
        const oldReservations = await db
          .select()
          .from(creditReservations)
          .where(
            and(
              lt(creditReservations.updatedAt, thirtyDaysAgo)
            )
          )
          .limit(this.BATCH_SIZE)
          .offset(offset);

        if (oldReservations.length === 0) {
          hasMore = false;
          break;
        }

        // Deletar este lote (apenas reservas não-pending)
        const nonPendingReservations = oldReservations.filter(r => r.status !== "pending");
        
        if (nonPendingReservations.length > 0) {
          try {
            const idsToDelete = nonPendingReservations.map(r => r.id);
            
            for (const id of idsToDelete) {
              await db
                .delete(creditReservations)
                .where(eq(creditReservations.id, id));
            }

            totalDeleted += nonPendingReservations.length;
            console.log(`✅ Lote deletado: ${nonPendingReservations.length} reservas antigas`);
          } catch (batchError) {
            const errorMsg = `Erro ao deletar lote de ${nonPendingReservations.length} reservas: ${batchError}`;
            errors.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
          }
        }

        offset += this.BATCH_SIZE;
        
        // Evitar loops infinitos
        if (offset > 10000) {
          errors.push("Limite de segurança atingido (10000 registros)");
          break;
        }
      }
      
      console.log(`✅ Limpeza de antigas concluída: ${totalDeleted} reservas deletadas, ${errors.length} erros`);
      
      return {
        deleted: totalDeleted,
        errors
      };
    } catch (error) {
      const errorMsg = `Erro geral na limpeza de antigas: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
      
      return {
        deleted: totalDeleted,
        errors
      };
    }
  }

  /**
   * Executa limpeza completa (expiradas + antigas)
   */
  static async fullCleanup(): Promise<{
    expired: number;
    deleted: number;
    errors: string[];
  }> {
    console.log(`🔄 Iniciando limpeza completa do sistema de créditos`);
    
    const expiredResult = await this.cleanupExpiredReservations();
    const deletedResult = await this.cleanupOldReservations();
    
    const allErrors = [...expiredResult.errors, ...deletedResult.errors];
    
    console.log(`✅ Limpeza completa finalizada:`, {
      expired: expiredResult.cancelled,
      deleted: deletedResult.deleted,
      totalErrors: allErrors.length
    });
    
    return {
      expired: expiredResult.cancelled,
      deleted: deletedResult.deleted,
      errors: allErrors
    };
  }

  /**
   * Verifica se é necessário executar limpeza (baseado no intervalo)
   */
  static shouldRunCleanup(): boolean {
    if (!this.lastCleanup) return true;
    
    const timeSinceLastCleanup = Date.now() - this.lastCleanup.getTime();
    return timeSinceLastCleanup >= this.CLEANUP_INTERVAL_MS;
  }

  /**
   * Executa limpeza apenas se necessário (throttling)
   */
  static async conditionalCleanup(): Promise<{
    executed: boolean;
    result?: {
      expired: number;
      deleted: number;
      errors: string[];
    };
  }> {
    if (!this.shouldRunCleanup()) {
      console.log(`⏭️ Limpeza pulada - última execução há ${Math.round((Date.now() - (this.lastCleanup?.getTime() || 0)) / 1000)}s`);
      return { executed: false };
    }

    const result = await this.fullCleanup();
    return {
      executed: true,
      result
    };
  }

  /**
   * Obtém estatísticas das reservas
   */
  static async getReservationStats(): Promise<{
    pending: number;
    confirmed: number;
    cancelled: number;
    expired: number;
  }> {
    const now = new Date();
    
    const [pending, confirmed, cancelled, expired] = await Promise.all([
      db.select().from(creditReservations).where(eq(creditReservations.status, "pending")),
      db.select().from(creditReservations).where(eq(creditReservations.status, "confirmed")),
      db.select().from(creditReservations).where(eq(creditReservations.status, "cancelled")),
      db.select().from(creditReservations).where(
        and(
          eq(creditReservations.status, "pending"),
          lt(creditReservations.expiresAt, now)
        )
      )
    ]);

    return {
      pending: pending.length,
      confirmed: confirmed.length,
      cancelled: cancelled.length,
      expired: expired.length
    };
  }
}