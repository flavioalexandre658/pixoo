"use client";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { earnCredits as earnCreditsAction } from "@/actions/credits/earn/earn-credits.action";
import { spendCredits as spendCreditsAction } from "@/actions/credits/spend/spend-credits.action";
import { reserveCredits as reserveCreditsAction } from "@/actions/credits/reserve/reserve-credits.action";
import { confirmCredits as confirmCreditsAction } from "@/actions/credits/confirm/confirm-credits.action";
import { refundCredits as refundCreditsAction } from "@/actions/credits/refund/refund-credits.action";
import { cancelReservation as cancelReservationAction } from "@/actions/credits/cancel/cancel-reservation.action";
import { useAction } from "next-safe-action/hooks";
import { useCreditsContext } from "@/contexts/credits-context";

export function useCredits() {
  const { data: session } = useSession();
  const { credits, isLoading, error, fetchCredits, updateCredits } = useCreditsContext();
  const { executeAsync: executeReserveCreditsAction } =
    useAction(reserveCreditsAction);
  const { executeAsync: executeConfirmCreditsAction } =
    useAction(confirmCreditsAction);
  const { executeAsync: executeRefundCreditsAction } =
    useAction(refundCreditsAction);
  const { executeAsync: executeCancelReservationAction } = useAction(
    cancelReservationAction
  );
  const { executeAsync: executeEarnCreditsAction } =
    useAction(earnCreditsAction);
  const { executeAsync: executeSpendCreditsAction } =
    useAction(spendCreditsAction);




  // Verificar se tem créditos suficientes
  const hasEnoughCredits = (requiredCredits: number): boolean => {
    return credits ? credits.balance >= requiredCredits : false;
  };

  // Reservar créditos antes da geração
  const reserveCredits = async (
    modelId: string
  ): Promise<{ reservationId: string; cost: number } | null> => {
    if (!session?.user?.id) {
      toast.error("Usuário não autenticado");
      return null;
    }

    try {
      const result = await executeReserveCreditsAction({
        modelId,
        description: `Reserva para geração de imagem - ${modelId}`,
      });

      if (result?.data?.success) {
        return result.data?.data || null;
      } else {
        const errorMessage =
          result?.data?.errors?._form?.[0] || "Erro ao reservar créditos";
        toast.error(errorMessage);
        return null;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao reservar créditos";
      toast.error(errorMessage);
      return null;
    }
  };

  // Confirmar gasto de créditos após geração bem-sucedida
  const confirmSpendCredits = async (
    reservationId: string,
    modelId: string,
    imageId?: string
  ): Promise<boolean> => {
    if (!session?.user?.id) {
      toast.error("Usuário não autenticado");
      return false;
    }

    try {
      const result = await executeConfirmCreditsAction({
        reservationId,
        modelId,
        imageId,
        description: `Geração de imagem - ${modelId}`,
      });

      if (result?.data?.success) {
        // Atualizar créditos após confirmação
        await fetchCredits();
        return true;
      } else {
        const errorMessage =
          result?.data?.errors?._form?.[0] ||
          "Erro ao confirmar gasto de créditos";
        toast.error(errorMessage);
        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erro ao confirmar gasto de créditos";
      toast.error(errorMessage);
      return false;
    }
  };

  // Cancelar reserva de créditos (quando usuário não foi cobrado)
  const cancelReservation = async (
    reservationId: string,
    reason?: string
  ): Promise<boolean> => {
    if (!session?.user?.id) {
      toast.error("Usuário não autenticado");
      return false;
    }

    try {
      const result = await executeCancelReservationAction({
        reservationId,
        reason,
        userId: session.user.id,
      });

      if (result?.data?.success) {
        // Atualizar créditos após cancelamento
        await fetchCredits();
        toast.success("Reserva cancelada com sucesso");
        return true;
      } else {
        const errorMessage =
          result?.data?.errors?._form?.[0] || "Erro ao cancelar reserva";
        toast.error(errorMessage);
        return false;
      }
    } catch (error) {
      console.error("Erro ao cancelar reserva:", error);
      toast.error("Erro ao cancelar reserva");
      return false;
    }
  };

  // Reembolsar créditos em caso de falha (quando usuário já foi cobrado)
  const refundCredits = async (
    amount: number,
    description: string,
    relatedImageId?: string
  ): Promise<boolean> => {
    if (!session?.user?.id) {
      toast.error("Usuário não autenticado");
      return false;
    }

    try {
      const result = await executeRefundCreditsAction({
        amount,
        description,
        relatedImageId,
      });

      if (result?.data?.success) {
        // Atualizar créditos após reembolso
        await fetchCredits();
        toast.success("Créditos reembolsados com sucesso");
        return true;
      } else {
        const errorMessage =
          result?.data?.errors?._form?.[0] || "Erro ao reembolsar créditos";
        toast.error(errorMessage);
        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao reembolsar créditos";
      toast.error(errorMessage);
      return false;
    }
  };

  // Método legado mantido para compatibilidade
  const spendCredits = async (
    modelId: string,
    imageId?: string
  ): Promise<boolean> => {
    if (!session?.user?.id) {
      toast.error("Usuário não autenticado");
      return false;
    }

    try {
      const result = await executeSpendCreditsAction({
        modelId,
        imageId,
        description: `Geração de imagem - ${modelId}`,
      });

      if (result?.data?.success) {
        // Atualizar créditos após gasto
        await fetchCredits();
        return true;
      } else {
        const errorMessage =
          result?.data?.errors?._form?.[0] || "Erro ao gastar créditos";
        toast.error(errorMessage);
        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao gastar créditos";
      toast.error(errorMessage);
      return false;
    }
  };

  // Adicionar créditos
  const earnCredits = async (
    amount: number,
    description: string,
    type: "earned" | "bonus" | "refund" = "earned"
  ): Promise<boolean> => {
    if (!session?.user?.id) {
      toast.error("Usuário não autenticado");
      return false;
    }

    try {
      const result = await executeEarnCreditsAction({
        amount,
        description,
        type,
      });

      if (result?.data?.success) {
        // Atualizar créditos após ganho
        await fetchCredits();
        toast.success(`${amount} créditos adicionados!`);
        return true;
      } else {
        const errorMessage =
          result?.data?.errors?._form?.[0] || "Erro ao adicionar créditos";
        toast.error(String(errorMessage));
        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao adicionar créditos";
      toast.error(errorMessage);
      return false;
    }
  };



  return {
    credits,
    isLoading,
    error,
    fetchCredits,
    hasEnoughCredits,
    spendCredits,
    earnCredits,
    balance: credits?.balance || 0,
    totalEarned: credits?.totalEarned || 0,
    totalSpent: credits?.totalSpent || 0,
    recentTransactions: credits?.recentTransactions || [],
    // Novos métodos para sistema de reserva
    reserveCredits,
    confirmSpendCredits,
    cancelReservation,
    refundCredits,
  };
}
