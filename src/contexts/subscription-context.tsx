"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { ISubscription } from '@/interfaces/subscription.interface';
import { useSession } from '@/lib/auth-client';
import { getUserActiveSubscription } from '@/actions/subscriptions/get/get-user-active-subscription.action';
import { useAction } from 'next-safe-action/hooks';

interface SubscriptionContextType {
  subscription: ISubscription | null;
  isLoading: boolean;
  error: string | null;
  hasActiveSubscription: boolean;
  fetchSubscription: () => Promise<void>;
  updateSubscription: (newSubscription: ISubscription | null) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
  initialSubscription?: ISubscription | null;
}

export function SubscriptionProvider({ children, initialSubscription = null }: SubscriptionProviderProps) {
  const [subscription, setSubscription] = useState<ISubscription | null>(initialSubscription);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const { executeAsync: executeGetSubscription } = useAction(getUserActiveSubscription);

  const fetchSubscription = useCallback(async () => {
    if (!session?.user?.id) {
      setSubscription(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await executeGetSubscription({ userId: session.user.id });

      if (result?.data?.success) {
        setSubscription(result?.data?.data || null);
      } else {
        setSubscription(null);
        setError(result?.data?.errors?._form?.[0] || 'Erro ao carregar assinatura');
      }
    } catch (err) {
      setError('Erro inesperado ao carregar assinatura');
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, executeGetSubscription]);

  const updateSubscription = (newSubscription: ISubscription | null) => {
    setSubscription(newSubscription);
  };

  const hasActiveSubscription = subscription?.status === 'active';

  useEffect(() => {
    if (session?.user?.id && !initialSubscription) {
      fetchSubscription();
    }
  }, [session?.user?.id, initialSubscription, fetchSubscription]);

  const value: SubscriptionContextType = {
    subscription,
    isLoading,
    error,
    hasActiveSubscription,
    fetchSubscription,
    updateSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription deve ser usado dentro de um SubscriptionProvider');
  }
  return context;
}