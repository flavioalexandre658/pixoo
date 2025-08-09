"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserCreditsSummary } from '@/interfaces/credits.interface';
import { useSession } from '@/lib/auth-client';
import { getUserCredits } from '@/actions/credits/get/get-user-credits.action';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

interface CreditsContextType {
  credits: UserCreditsSummary | null;
  isLoading: boolean;
  error: string | null;
  fetchCredits: () => Promise<void>;
  updateCredits: (newCredits: UserCreditsSummary) => void;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

interface CreditsProviderProps {
  children: ReactNode;
  initialCredits?: UserCreditsSummary | null;
}

export function CreditsProvider({ children, initialCredits = null }: CreditsProviderProps) {
  const { data: session } = useSession();
  const [credits, setCredits] = useState<UserCreditsSummary | null>(initialCredits);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { executeAsync: executeGetUserCreditsAction } = useAction(getUserCredits);

  // Buscar créditos do usuário
  const fetchCredits = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await executeGetUserCreditsAction({});

      if (result?.data?.success) {
        setCredits(result.data?.data || null);
      } else {
        const errorMessage = result?.data?.errors?._form?.[0] || 'Erro ao buscar créditos';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar créditos manualmente (para sincronização)
  const updateCredits = (newCredits: UserCreditsSummary) => {
    setCredits(newCredits);
  };

  // Buscar créditos quando a sessão estiver disponível
  useEffect(() => {
    if (session?.user?.id && !initialCredits) {
      fetchCredits();
    }
  }, [session?.user?.id]);

  // Atualizar créditos periodicamente e quando a aba volta ao foco
  useEffect(() => {
    if (!session?.user?.id) return;

    // Atualizar quando a aba volta ao foco
    const handleFocus = () => {
      fetchCredits();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCredits();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session?.user?.id]);

  const value: CreditsContextType = {
    credits,
    isLoading,
    error,
    fetchCredits,
    updateCredits,
  };

  return (
    <CreditsContext.Provider value={value}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCreditsContext() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCreditsContext must be used within a CreditsProvider');
  }
  return context;
}