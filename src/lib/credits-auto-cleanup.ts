import { CreditsCleanupService } from "@/services/credits/credits-cleanup.service";

/**
 * Sistema de limpeza automática de créditos
 * Executa em background sem interferir na lógica principal
 */
export class CreditsAutoCleanup {
  private static instance: CreditsAutoCleanup | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private readonly INTERVAL_MS = 10 * 60 * 1000; // 10 minutos

  private constructor() {}

  static getInstance(): CreditsAutoCleanup {
    if (!this.instance) {
      this.instance = new CreditsAutoCleanup();
    }
    return this.instance;
  }

  /**
   * Inicia a limpeza automática periódica
   */
  start(): void {
    if (this.isRunning) {
      console.log("🔄 Limpeza automática de créditos já está em execução");
      return;
    }

    console.log(`🚀 Iniciando limpeza automática de créditos (intervalo: ${this.INTERVAL_MS / 1000}s)`);
    
    this.isRunning = true;
    
    // Executar uma limpeza inicial após 30 segundos
    setTimeout(() => {
      this.runCleanup();
    }, 30000);

    // Configurar intervalo regular
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, this.INTERVAL_MS);
  }

  /**
   * Para a limpeza automática
   */
  stop(): void {
    if (!this.isRunning) {
      console.log("⏹️ Limpeza automática de créditos já está parada");
      return;
    }

    console.log("⏹️ Parando limpeza automática de créditos");
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
  }

  /**
   * Executa uma limpeza (com proteção contra erros)
   */
  private async runCleanup(): Promise<void> {
    try {
      console.log(`🧹 Executando limpeza automática: ${new Date().toISOString()}`);
      
      const result = await CreditsCleanupService.conditionalCleanup();
      
      if (result.executed && result.result) {
        const { expired, deleted, errors } = result.result;
        console.log(`✅ Limpeza automática concluída: ${expired} expiradas, ${deleted} deletadas${errors.length > 0 ? `, ${errors.length} erros` : ''}`);
        
        if (errors.length > 0) {
          console.warn(`⚠️ Erros na limpeza automática:`, errors);
        }
      } else {
        console.log(`⏭️ Limpeza automática pulada (throttling)`);
      }
    } catch (error) {
      console.error(`❌ Erro na limpeza automática:`, {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      // Não parar o serviço por causa de um erro
    }
  }

  /**
   * Força uma limpeza imediata (ignora throttling)
   */
  async forceCleanup(): Promise<{
    expired: number;
    deleted: number;
    errors: string[];
  }> {
    console.log(`🔧 Forçando limpeza imediata de créditos`);
    return await CreditsCleanupService.fullCleanup();
  }

  /**
   * Obtém o status do serviço
   */
  getStatus(): {
    isRunning: boolean;
    intervalMs: number;
    nextCleanupEstimate?: Date;
  } {
    const status = {
      isRunning: this.isRunning,
      intervalMs: this.INTERVAL_MS
    };

    if (this.isRunning) {
      // Estimar próxima limpeza (aproximado)
      return {
        ...status,
        nextCleanupEstimate: new Date(Date.now() + this.INTERVAL_MS)
      };
    }

    return status;
  }

  /**
   * Obtém estatísticas das reservas
   */
  async getStats(): Promise<{
    pending: number;
    confirmed: number;
    cancelled: number;
    expired: number;
  }> {
    return await CreditsCleanupService.getReservationStats();
  }
}

// Instância singleton para uso global
export const creditsAutoCleanup = CreditsAutoCleanup.getInstance();

// Auto-iniciar em produção (apenas no servidor)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  // Aguardar um pouco antes de iniciar para evitar problemas de inicialização
  setTimeout(() => {
    creditsAutoCleanup.start();
  }, 5000);
}