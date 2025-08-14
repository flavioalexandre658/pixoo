'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { Crown, Zap, Star, Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { getPlansByCurrency } from '@/actions/plans/get/get-plans-by-currency.action';

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceInCents: number;
  currency: string;
  interval: string;
  intervalCount: number;
  credits: number;
  features: string[];
  isActive: boolean | null;
  isPopular: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  priceFormatted: string;
  stripePriceId: string;
}

interface PlansListProps {
  locale: string;
  onPlanSelect?: (plan: Plan) => void;
  showSelectButton?: boolean;
  buttonText?: string;
  className?: string;
}

export function PlansList({
  locale,
  onPlanSelect,
  showSelectButton = true,
  buttonText,
  className = ''
}: PlansListProps) {
  const t = useTranslations('subscriptionRequired');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState<string | null>(null);

  // Determinar moeda baseada no locale
  const currency = locale === 'pt' ? 'BRL' : 'USD';

  // Action para buscar planos
  const { execute: fetchPlans, isExecuting: isLoadingPlans } = useAction(getPlansByCurrency, {
    onSuccess: (result) => {
      if (result.data?.success && result.data.data) {
        setPlans(result.data.data);
      }
    },
    onError: (error) => {
      console.error('Erro ao buscar planos:', error);
      toast.error('Erro ao carregar planos');
    },
  });

  // Buscar planos ao montar o componente
  useEffect(() => {
    fetchPlans({ currency });
  }, [currency, fetchPlans]);

  // Função para criar checkout
  const handleCreateCheckout = async (plan: Plan) => {
    if (plan.priceInCents === 0) {
      toast.error('Plano gratuito não requer checkout');
      return;
    }

    setIsCreatingCheckout(plan.id);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planCode: plan.code,
          currency: plan.currency,
          interval: plan.interval,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar sessão de checkout');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não recebida');
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao processar pagamento'
      );
    } finally {
      setIsCreatingCheckout(null);
    }
  };

  // Função para lidar com seleção de plano
  const handlePlanAction = (plan: Plan) => {
    if (onPlanSelect) {
      onPlanSelect(plan);
    } else {
      handleCreateCheckout(plan);
    }
  };

  // Ícones para diferentes tipos de planos
  const getPlanIcon = (code: string) => {
    switch (code) {
      case 'free':
        return Zap;
      case 'starter':
        return Star;
      case 'premium':
      case 'advanced':
        return Crown;
      default:
        return Zap;
    }
  };

  if (isLoadingPlans) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando planos...</span>
      </div>
    );
  }

  if (!plans.length) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground">Nenhum plano disponível no momento.</p>
      </div>
    );
  }

  return (
    <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {plans.map((plan) => {
        const IconComponent = getPlanIcon(plan.code);
        const isLoading = isCreatingCheckout === plan.id;

        return (
          <Card
            key={plan.id}
            className={`relative transition-all hover:shadow-lg ${plan.isPopular ? 'border-primary shadow-lg scale-105' : ''
              }`}
          >
            {plan.isPopular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                <Star className="h-3 w-3 mr-1" />
                {t('popular')}
              </Badge>
            )}

            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <IconComponent
                  className={`h-8 w-8 ${plan.isPopular ? 'text-primary' : 'text-muted-foreground'
                    }`}
                />
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription className="min-h-[3rem]">
                {plan.description}
              </CardDescription>
              <div className="text-3xl font-bold text-primary">
                {plan.priceFormatted}
                {plan.priceInCents > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    /{plan.interval === 'monthly' ? 'mês' : 'ano'}
                  </span>
                )}
              </div>
              {plan.credits > 0 && (
                <p className="text-sm text-muted-foreground">
                  {plan.credits} créditos {plan.interval === 'monthly' ? 'mensais' : 'anuais'}
                </p>
              )}
            </CardHeader>

            <CardContent className="flex-1">
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {showSelectButton && (
                <Button
                  onClick={() => handlePlanAction(plan)}
                  disabled={isLoading}
                  className={`w-full ${plan.isPopular
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                    }`}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      {plan.priceInCents === 0 ? (
                        'Plano Atual'
                      ) : (
                        buttonText || 'Selecionar Plano'
                      )}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}