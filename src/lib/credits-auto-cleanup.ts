import { CreditsCleanupService } from '@/services/credits/credits-cleanup.service';

/**
 * Sistema de limpeza automática de créditos
 * Gerencia a limpeza automática em background
 */
class CreditsAutoCleanup {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private readonly intervalMs = 5 * 60 * 1000; // 5 minutos

  /**
   * Inicia a limpeza automática
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Limpeza automática já está rodando');
      return;
    }

    this.intervalId = setInterval(async () => {
      try {
        await CreditsCleanupService.conditionalCleanup();
      } catch (error) {
        console.error('❌ Erro na limpeza automática:', error);
      }
    }, this.intervalMs);

    this.isRunning = true;
    console.log('✅ Limpeza automática iniciada');
  }

  /**
   * Para a limpeza automática
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Limpeza automática parada');
  }

  /**
   * Força uma limpeza imediata
   */
  async forceCleanup() {
    return await CreditsCleanupService.fullCleanup();
  }

  /**
   * Obtém o status atual
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
      nextCleanupIn: this.isRunning ? this.intervalMs : null
    };
  }

  /**
   * Obtém estatísticas
   */
  async getStats() {
    return await CreditsCleanupService.getReservationStats();
  }
}

// Instância singleton
export const creditsAutoCleanup = new CreditsAutoCleanup();