import { ReservationCleanupService } from "../services/credits/cleanup-expired-reservations";

/**
 * Middleware para limpeza automática de reservas expiradas
 * Executa a limpeza em intervalos regulares ou sob demanda
 */
export class CreditsCleanupMiddleware {
  private static lastCleanup: Date | null = null;
  private static cleanupInterval = 5 * 60 * 1000; // 5 minutos
  private static isCleanupRunning = false;

  /**
   * Executa limpeza se necessário (baseado no intervalo)
   */
  static async cleanupIfNeeded(): Promise<void> {
    const now = new Date();
    
    // Verificar se já passou tempo suficiente desde a última limpeza
    if (
      this.lastCleanup && 
      (now.getTime() - this.lastCleanup.getTime()) < this.cleanupInterval
    ) {
      return; // Ainda não é hora de limpar
    }

    // Evitar múltiplas limpezas simultâneas
    if (this.isCleanupRunning) {
      return;
    }

    try {
      this.isCleanupRunning = true;
      console.log(`🧹 Executando limpeza automática de reservas expiradas...`);
      
      const result = await ReservationCleanupService.cleanupExpiredReservations();
      
      if (result > 0) {
        console.log(`✅ Limpeza concluída: ${result} reservas expiradas canceladas`);
      }
      
      this.lastCleanup = now;
    } catch (error) {
      console.error(`❌ Erro na limpeza automática:`, error);
    } finally {
      this.isCleanupRunning = false;
    }
  }

  /**
   * Força uma limpeza imediata
   */
  static async forceCleanup(): Promise<{ expired: number; old: number }> {
    try {
      this.isCleanupRunning = true;
      console.log(`🧹 Executando limpeza forçada...`);
      
      const result = await ReservationCleanupService.fullCleanup();
      
      console.log(`✅ Limpeza forçada concluída:`, result);
      this.lastCleanup = new Date();
      
      return result;
    } catch (error) {
      console.error(`❌ Erro na limpeza forçada:`, error);
      throw error;
    } finally {
      this.isCleanupRunning = false;
    }
  }

  /**
   * Configura o intervalo de limpeza
   */
  static setCleanupInterval(intervalMs: number): void {
    this.cleanupInterval = intervalMs;
    console.log(`⚙️ Intervalo de limpeza configurado para ${intervalMs}ms`);
  }

  /**
   * Obtém informações sobre o status da limpeza
   */
  static getCleanupStatus(): {
    lastCleanup: Date | null;
    intervalMs: number;
    isRunning: boolean;
    nextCleanupIn: number | null;
  } {
    const now = new Date();
    let nextCleanupIn: number | null = null;
    
    if (this.lastCleanup) {
      const timeSinceLastCleanup = now.getTime() - this.lastCleanup.getTime();
      nextCleanupIn = Math.max(0, this.cleanupInterval - timeSinceLastCleanup);
    }

    return {
      lastCleanup: this.lastCleanup,
      intervalMs: this.cleanupInterval,
      isRunning: this.isCleanupRunning,
      nextCleanupIn
    };
  }

  /**
   * Middleware para Next.js API routes
   * Executa limpeza automática antes de processar a requisição
   */
  static async apiMiddleware<T>(
    handler: () => Promise<T>
  ): Promise<T> {
    // Executar limpeza se necessário (não bloqueia a requisição)
    this.cleanupIfNeeded().catch(error => {
      console.error(`❌ Erro na limpeza automática durante middleware:`, error);
    });

    // Executar o handler original
    return await handler();
  }
}

/**
 * Hook para executar limpeza em componentes React
 */
export function useCreditsCleanup() {
  const cleanup = async () => {
    try {
      await CreditsCleanupMiddleware.cleanupIfNeeded();
    } catch (error) {
      console.error(`❌ Erro na limpeza de créditos:`, error);
    }
  };

  const forceCleanup = async () => {
    try {
      return await CreditsCleanupMiddleware.forceCleanup();
    } catch (error) {
      console.error(`❌ Erro na limpeza forçada:`, error);
      throw error;
    }
  };

  const getStatus = () => {
    return CreditsCleanupMiddleware.getCleanupStatus();
  };

  return {
    cleanup,
    forceCleanup,
    getStatus
  };
}