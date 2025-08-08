import { getUserCredits } from "@/actions/credits/get/get-user-credits.action";
import { earnCredits } from "@/actions/credits/earn/earn-credits.action";
import { spendCredits } from "@/actions/credits/spend/spend-credits.action";

/**
 * Middleware para gerenciar créditos de usuários
 * Garante que novos usuários recebam créditos iniciais
 */
export class CreditsMiddleware {
  /**
   * Verifica e cria créditos iniciais para um usuário se necessário
   * @param userId ID do usuário
   * @param initialCredits Quantidade de créditos iniciais (padrão: 10)
   */
  static async ensureUserCredits(
    userId: string,
    initialCredits: number = 10
  ): Promise<void> {
    try {
      // Verificar se o usuário já tem créditos
      const result = await getUserCredits({});
      
      if (!result?.data?.success || !result.data?.data || result.data?.data.balance === 0) {
        // Criar créditos iniciais usando earnCredits
        await earnCredits({
          amount: initialCredits,
          description: "Créditos de boas-vindas",
          type: "bonus",
        });
        console.log(`✅ Créditos iniciais criados para usuário ${userId}: ${initialCredits} créditos`);
      }
    } catch (error) {
      console.error(`❌ Erro ao garantir créditos para usuário ${userId}:`, error);
      // Não lançar erro para não quebrar o fluxo principal
    }
  }

  /**
   * Middleware para ser usado em APIs que requerem verificação de créditos
   * @param userId ID do usuário
   * @param requiredCredits Créditos necessários para a operação
   */
  static async validateCredits(
    userId: string,
    requiredCredits: number
  ): Promise<{ valid: boolean; message?: string }> {
    try {
      // Garantir que o usuário tem registro de créditos
      await this.ensureUserCredits(userId);
      
      // Verificar se tem créditos suficientes
      const userCreditsResult = await getUserCredits({});
      const currentBalance = userCreditsResult?.data?.data?.balance || 0;
      const hasCredits = currentBalance >= requiredCredits;
      
      if (!hasCredits) {
        
        return {
          valid: false,
          message: `Créditos insuficientes. Saldo atual: ${currentBalance}, necessário: ${requiredCredits}`,
        };
      }
      
      return { valid: true };
    } catch (error) {
      console.error(`❌ Erro ao validar créditos para usuário ${userId}:`, error);
      return {
        valid: false,
        message: "Erro interno ao verificar créditos",
      };
    }
  }

  /**
   * Processa o gasto de créditos após uma operação bem-sucedida
   * @param userId ID do usuário
   * @param modelId ID do modelo usado
   * @param imageId ID da imagem gerada (opcional)
   * @param description Descrição da transação
   */
  static async processCreditsSpent(
    userId: string,
    modelId: string,
    imageId?: string,
    description?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await spendCredits({
        modelId,
        imageId,
        description: description || `Geração de imagem - ${modelId}`,
      });
      
      if (!result?.data?.success) {
        const errorMessage = result?.data?.errors?._form?.[0] || "Erro ao processar gasto de créditos";
        throw new Error(errorMessage);
      }
      
      return { success: true };
    } catch (error) {
      console.error(`❌ Erro ao processar gasto de créditos:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Adiciona créditos de bônus para um usuário
   * @param userId ID do usuário
   * @param amount Quantidade de créditos
   * @param reason Motivo do bônus
   */
  static async addBonusCredits(
    userId: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await earnCredits({
        amount,
        description: reason,
        type: "bonus",
      });
      
      if (result?.data?.success) {
        return { success: true };
      } else {
        const errorMessage = result?.data?.errors?._form?.[0] || "Erro ao adicionar créditos";
        return {
          success: false,
          message: String(errorMessage),
        };
      }
    } catch (error) {
      console.error(`❌ Erro ao adicionar créditos de bônus:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }
}