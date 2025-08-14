'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { Crown, Zap, Star, Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { getPlansByCurrency } from '@/actions/plans/get/get-plans-by-currency.action';
import { createCheckoutSession } from '@/actions/checkout/create/create-checkout-session.action';

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
  excludeFreePlan?: boolean;
  onCheckoutSuccess?: () => void;
}

export function PlansList({
  locale,
  onPlanSelect,
  showSelectButton = true,
  buttonText,
  className = '',
  excludeFreePlan = false,
  onCheckoutSuccess
}: PlansListProps) {
  const t = useTranslations('subscriptionRequired');
  const { data: session } = useSession();
  const [plans, setPlans] = useState<Plan[]>([]);

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

  // Action para criar checkout
  const { execute: executeCreateCheckout, isExecuting: isCreatingCheckoutAction } = useAction(createCheckoutSession, {
    onSuccess: (result) => {
      if (result.data?.success && result.data.data?.url) {
        console.log('🔗 Redirecionando para URL de checkout:', result.data.data.url);
        // Chamar callback de sucesso antes do redirecionamento
        if (onCheckoutSuccess) {
          onCheckoutSuccess();
        }
        window.location.href = result.data.data.url;
      } else {
        toast.error('URL de checkout não recebida');
      }
    },
    onError: (error) => {
      console.error('❌ Erro ao criar checkout:', error);
      const errorMessage = error.error?.serverError || 'Erro ao processar pagamento';
      toast.error(errorMessage);
    },
  });

  // Buscar planos ao montar o componente
  useEffect(() => {
    fetchPlans({ currency });
  }, [currency, fetchPlans]);

  // Função para criar checkout
  const handleCreateCheckout = async (plan: Plan) => {
    console.log('🛒 Iniciando processo de checkout para plano:', plan);
    
    if (!session?.user?.id) {
      console.log('❌ Usuário não autenticado');
      toast.error('Você precisa estar logado para fazer checkout');
      return;
    }

    console.log('📤 Executando action de checkout...');
    executeCreateCheckout({
      planCode: plan.code,
      currency: plan.currency as 'USD' | 'BRL',
      interval: plan.interval as 'monthly' | 'yearly',
    });
  };

  // Função para lidar com seleção de plano
  const handlePlanAction = (plan: Plan) => {
    console.log('🎯 handlePlanAction chamada para plano:', plan.code, plan.name);
    console.log('🔍 onPlanSelect existe?', !!onPlanSelect);
    
    if (onPlanSelect) {
      console.log('📞 Chamando onPlanSelect...');
      onPlanSelect(plan);
    } else {
      console.log('💳 Chamando handleCreateCheckout...');
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

  // Filtrar planos se necessário
  const filteredPlans = excludeFreePlan 
    ? plans.filter(plan => plan.code !== 'free' && plan.priceInCents > 0)
    : plans;

  // Adaptar layout baseado no número de planos
  const gridCols = excludeFreePlan 
    ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4'
    : 'grid md:grid-cols-2 lg:grid-cols-4 gap-4';

  return (
    <div className={`${gridCols} ${className}`}>
      {filteredPlans.map((plan) => {
        const IconComponent = getPlanIcon(plan.code);
        const isLoading = isCreatingCheckoutAction;

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
                  disabled={isCreatingCheckoutAction}
                  className={`w-full ${plan.isPopular
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                    }`}
                  size="lg"
                >
                  {isCreatingCheckoutAction ? (
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