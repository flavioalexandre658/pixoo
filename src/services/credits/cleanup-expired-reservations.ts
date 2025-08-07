import { db } from "../../../db";
import { creditReservations } from "../../../db/schema";
import { and, eq, lt } from "drizzle-orm";

/**
 * Limpa reservas expiradas do banco de dados
 * Esta função deve ser executada periodicamente para manter o banco limpo
 */
export class ReservationCleanupService {
  /**
   * Cancela todas as reservas que expiraram
   * @returns Número de reservas canceladas
   */
  static async cleanupExpiredReservations(): Promise<number> {
    try {
      const now = new Date();
      
      // Buscar reservas expiradas que ainda estão pendentes
      const expiredReservations = await db
        .select()
        .from(creditReservations)
        .where(
          and(
            eq(creditReservations.status, "pending"),
            lt(creditReservations.expiresAt, now)
          )
        );

      if (expiredReservations.length === 0) {
        console.log("✅ Nenhuma reserva expirada encontrada");
        return 0;
      }

      // Cancelar reservas expiradas
      const result = await db
        .update(creditReservations)
        .set({ 
          status: "cancelled", 
          updatedAt: now 
        })
        .where(
          and(
            eq(creditReservations.status, "pending"),
            lt(creditReservations.expiresAt, now)
          )
        );

      console.log(`✅ ${expiredReservations.length} reservas expiradas foram canceladas`);
      return expiredReservations.length;
    } catch (error) {
      console.error("❌ Erro ao limpar reservas expiradas:", error);
      throw error;
    }
  }

  /**
   * Remove reservas antigas (canceladas ou confirmadas) do banco
   * @param daysOld Número de dias para considerar uma reserva como antiga (padrão: 7)
   * @returns Número de reservas removidas
   */
  static async removeOldReservations(daysOld: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      // Buscar reservas antigas que não estão pendentes
      const oldReservations = await db
        .select()
        .from(creditReservations)
        .where(
          and(
            lt(creditReservations.createdAt, cutoffDate),
            // Não remover reservas pendentes, apenas canceladas ou confirmadas
            // eq(creditReservations.status, "cancelled") // Comentado para não remover confirmadas também
          )
        );

      if (oldReservations.length === 0) {
        console.log(`✅ Nenhuma reserva antiga (>${daysOld} dias) encontrada`);
        return 0;
      }

      // Por segurança, vamos apenas cancelar reservas muito antigas que ainda estão pendentes
      // Em vez de deletar, para manter auditoria
      const result = await db
        .update(creditReservations)
        .set({ 
          status: "cancelled", 
          updatedAt: new Date() 
        })
        .where(
          and(
            lt(creditReservations.createdAt, cutoffDate),
            eq(creditReservations.status, "pending")
          )
        );

      console.log(`✅ ${oldReservations.filter(r => r.status === 'pending').length} reservas antigas foram canceladas`);
      return oldReservations.filter(r => r.status === 'pending').length;
    } catch (error) {
      console.error("❌ Erro ao remover reservas antigas:", error);
      throw error;
    }
  }

  /**
   * Executa limpeza completa: cancela expiradas e remove antigas
   */
  static async fullCleanup(): Promise<{ expired: number; old: number }> {
    const expired = await this.cleanupExpiredReservations();
    const old = await this.removeOldReservations();
    
    return { expired, old };
  }
}