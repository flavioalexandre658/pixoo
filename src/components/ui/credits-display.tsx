"use client";

import { useCredits } from "@/hooks/use-credits";
import { Coins, Loader2, Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { useSubscription } from "@/contexts/subscription-context";
import { useState, useEffect } from "react";
import { getUserFreeCredits } from "@/actions/credits/get/get-user-free-credits.action";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

interface FreeCreditsData {
  freeCreditsBalance: number;
  hasActiveSubscription: boolean;
  canUseFreeCredits: boolean;
  hoursUntilRenewal: number;
  lastRenewal: Date | null;
  canRenew?: boolean;
  needsInitialCredits?: boolean;
}

interface CreditsDisplayProps {
  variant?: "compact" | "full";
  showAddButton?: boolean;
  className?: string;
}

export function CreditsDisplay({
  variant = "compact",
  showAddButton = false,
  className = "",
}: CreditsDisplayProps) {
  const t = useTranslations('credits');
  const { credits, isLoading } = useCredits();
  const { data: session } = useSession();
  const { subscription } = useSubscription();
  const [freeCredits, setFreeCredits] = useState<FreeCreditsData | null>(null);
  const [loadingFreeCredits, setLoadingFreeCredits] = useState(false);
  const balance = credits?.balance || 0;

  useEffect(() => {
    const fetchFreeCredits = async () => {
      if (!session?.user || subscription) {
        return;
      }

      setLoadingFreeCredits(true);
      try {
        const result = await getUserFreeCredits({});
        if (result?.data?.success && result.data.data) {
          setFreeCredits(result.data.data);
        }
      } catch (error) {
        console.error("Erro ao buscar créditos gratuitos:", error);
      } finally {
        setLoadingFreeCredits(false);
      }
    };

    fetchFreeCredits();
  }, [session, subscription]);

  if (isLoading || loadingFreeCredits) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-5 w-5" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  if (variant === "compact") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-3 ${className}`}>
              {/* Créditos pagos */}
              {subscription && credits && (
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <Badge variant="secondary" className="font-mono">
                    {balance}
                  </Badge>
                  {showAddButton && (
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}

              {/* Créditos gratuitos */}
              {!subscription && freeCredits && (
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <Badge variant="secondary" className="font-mono">
                    {freeCredits.freeCreditsBalance}
                  </Badge>
                  {showAddButton && (
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              {subscription && credits ? (
                <>
                  <p className="font-medium">{t('yourCredits')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('currentBalance', { balance })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('totalEarned')}: {credits.totalEarned}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('totalSpent')}: {credits.totalSpent}
                  </p>
                </>
              ) : freeCredits ? (
                <>
                  <p className="font-medium text-blue-600">
                    {t('freeCredits')}: {freeCredits.freeCreditsBalance}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('onlyForPixooFree')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {freeCredits.canRenew
                      ? t('renewalAvailable')
                      : t('nextRenewalIn', { hours: Math.floor(freeCredits.hoursUntilRenewal) })
                    }
                  </p>
                </>
              ) : (
                <p>{t('loginToSeeCredits')}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {subscription ? t('yourCredits') : t('freeCredits')}
        </h3>
        {showAddButton && subscription && (
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            {t('add')}
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {subscription && credits ? (
          <>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Coins className="h-8 w-8 text-yellow-500" />
              <div className="flex-1">
                <p className="text-2xl font-bold">{balance}</p>
                <p className="text-sm text-muted-foreground">{t('creditsAvailable')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg text-center">
                <p className="text-lg font-semibold text-green-600">
                  {credits.totalEarned}
                </p>
                <p className="text-xs text-muted-foreground">{t('totalEarned')}</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <p className="text-lg font-semibold text-red-600">
                  {credits.totalSpent}
                </p>
                <p className="text-xs text-muted-foreground">{t('totalSpent')}</p>
              </div>
            </div>

            {credits.recentTransactions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t('recentTransactions')}</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {credits.recentTransactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded"
                    >
                      <span className="truncate flex-1">
                        {transaction.description}
                      </span>
                      <span
                        className={`font-mono ${transaction.amount > 0 ? "text-green-600" : "text-red-600"
                          }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : freeCredits ? (
          <>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Coins className="h-8 w-8 text-yellow-500" />
              <div className="flex-1">
                <p className="text-2xl font-bold">{freeCredits.freeCreditsBalance}</p>
                <p className="text-sm text-muted-foreground">{t('creditsAvailable')}</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-800">
                  {t('importantInfo')}
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>{t('validOnlyForFluxSchnell')}</li>
                  <li>{t('renewedEvery24Hours')}</li>
                  <li>
                    {freeCredits.canRenew 
                        ? t('renewalAvailableNow') 
                        : t('nextRenewalInHours', { hours: freeCredits.hoursUntilRenewal })
                      }
                  </li>
                </ul>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 border rounded-lg text-center">
            <p className="text-muted-foreground">{t('loginToSeeCredits')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
