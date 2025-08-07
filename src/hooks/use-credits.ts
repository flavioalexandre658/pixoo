import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { UserCreditsSummary } from "@/interfaces/credits.interface";
import { toast } from "sonner";

export function useCredits() {
  const { data: session } = useSession();
  const [credits, setCredits] = useState<UserCreditsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar créditos do usuário
  const fetchCredits = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/credits");
      if (!response.ok) {
        throw new Error("Erro ao buscar créditos");
      }

      const data = await response.json();
      setCredits(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar se tem créditos suficientes
  const hasEnoughCredits = (requiredCredits: number): boolean => {
    return credits ? credits.balance >= requiredCredits : false;
  };

  // Reservar créditos antes da geração
  const reserveCredits = async (modelId: string): Promise<{ reservationId: string; cost: number } | null> => {
    if (!session?.user?.id) {
      toast.error("Usuário não autenticado");
      return null;
    }

    try {
      const response = await fetch("/api/credits/reserve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modelId,
          description: `Reserva para geração de imagem - ${modelId}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao reservar créditos");
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao reservar créditos";
      toast.error(errorMessage);
      return null;
    }
  };

  // Confirmar gasto de créditos após geração bem-sucedida
  const confirmSpendCredits = async (reservationId: string, modelId: string, imageId?: string): Promise<boolean> => {
    if (!session?.user?.id) {
      toast.error("Usuário não autenticado");
      return false;
    }

    try {
      const response = await fetch("/api/credits/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reservationId,
          modelId,
          imageId,
          description: `Geração de imagem - ${modelId}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao confirmar gasto de créditos");
      }

      // Atualizar créditos após confirmação
      await fetchCredits();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao confirmar gasto de créditos";
      toast.error(errorMessage);
      return false;
    }
  };

  // Reembolsar créditos em caso de falha
  const refundCredits = async (amount: number, description: string, relatedImageId?: string): Promise<boolean> => {
    if (!session?.user?.id) {
      toast.error("Usuário não autenticado");
      return false;
    }

    try {
      const response = await fetch("/api/credits/refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          description,
          relatedImageId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao reembolsar créditos");
      }

      // Atualizar créditos após reembolso
      await fetchCredits();
      toast.success("Créditos reembolsados com sucesso");
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao reembolsar créditos";
      toast.error(errorMessage);
      return false;
    }
  };

  // Método legado mantido para compatibilidade
  const spendCredits = async (modelId: string, imageId?: string): Promise<boolean> => {
    if (!session?.user?.id) {
      toast.error("Usuário não autenticado");
      return false;
    }

    try {
      const response = await fetch("/api/credits/spend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modelId,
          imageId,
          description: `Geração de imagem - ${modelId}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao gastar créditos");
      }

      // Atualizar créditos após gasto
      await fetchCredits();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao gastar créditos";
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
      const response = await fetch("/api/credits/earn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          description,
          type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao adicionar créditos");
      }

      // Atualizar créditos após ganho
      await fetchCredits();
      toast.success(`${amount} créditos adicionados!`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao adicionar créditos";
      toast.error(errorMessage);
      return false;
    }
  };

  // Buscar créditos quando o usuário estiver logado
  useEffect(() => {
    if (session?.user?.id) {
      fetchCredits();
    }
  }, [session?.user?.id]);

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
    refundCredits,
  };
}