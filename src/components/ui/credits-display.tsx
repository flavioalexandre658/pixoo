"use client";

import { useCredits } from "@/hooks/use-credits";
import { Coins, Loader2, Plus, Sparkles } from "lucide-react";
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
  balance: number;
  hasActiveSubscription: boolean;
  canUseDailyCredits: boolean; // Alterado de canUseFreeCredits para canUseDailyCredits
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
  const t = useTranslations("credits");
  const { credits, isLoading, fetchCredits } = useCredits();
  const { data: session } = useSession();
  const { subscription } = useSubscription();
  const [freeCredits, setFreeCredits] = useState<FreeCreditsData | null>(null);
  const [loadingFreeCredits, setLoadingFreeCredits] = useState(false);
  const balance = credits?.balance || 0;

  const fetchFreeCredits = async () => {
    if (!session?.user || subscription) {
      return;
    }

    setLoadingFreeCredits(true);
    try {
      const result = await getUserFreeCredits({});
      if (result?.data?.success && result?.data?.data) {
        setFreeCredits(result.data.data);
      }
    } catch (error) {
      console.error("Erro ao buscar créditos gratuitos:", error);
    } finally {
      setLoadingFreeCredits(false);
    }
  };

  useEffect(() => {
    fetchFreeCredits();
  }, [session, subscription]);

  // Atualizar créditos quando a aba volta ao foco
  useEffect(() => {
    if (!session?.user?.id) return;

    const handleFocus = () => {
      fetchCredits();
      fetchFreeCredits();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCredits();
        fetchFreeCredits();
      }
    };

    const handleCreditsUpdate = () => {
      fetchCredits();
      fetchFreeCredits();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("creditsUpdated", handleCreditsUpdate);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("creditsUpdated", handleCreditsUpdate);
    };
  }, [session?.user?.id, fetchCredits]);

  if (isLoading || loadingFreeCredits) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative">
          <Skeleton className="h-5 w-5 rounded-full bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20" />
          <div className="absolute inset-0 bg-gradient-to-br from-pixoo-pink/10 to-pixoo-purple/10 rounded-full blur-sm animate-pulse" />
        </div>
        <Skeleton className="h-5 w-5 bg-gradient-to-r from-pixoo-magenta/20 to-pixoo-pink/20" />
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
            <div className={`flex items-center gap-3 relative ${className}`}>
              {/* Floating decorative elements */}
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-br from-pixoo-pink/30 to-pixoo-magenta/30 rounded-full blur-sm animate-pulse" />

              {/* Créditos pagos */}
              {subscription && credits && (
                <div className="flex items-center gap-2 relative group">
                  <div className="relative">
                    <Coins className="h-4 w-4 text-yellow-500 group-hover:text-pixoo-magenta transition-colors duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <Badge
                    variant="secondary"
                    className="font-mono bg-gradient-to-r from-pixoo-purple/10 to-pixoo-magenta/10 border-pixoo-purple/20 hover:from-pixoo-purple/20 hover:to-pixoo-magenta/20 transition-all duration-300 hover:scale-105"
                  >
                    {balance}
                  </Badge>
                  {showAddButton && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0 border-pixoo-magenta/30 bg-gradient-to-r from-pixoo-magenta/10 to-pixoo-pink/10 hover:from-pixoo-magenta/20 hover:to-pixoo-pink/20 hover:scale-110 transition-all duration-300"
                    >
                      <Plus className="h-3 w-3 text-pixoo-magenta" />
                    </Button>
                  )}
                </div>
              )}

              {/* Créditos gratuitos */}
              {!subscription && freeCredits && (
                <div className="flex items-center gap-2 relative group">
                  <div className="relative">
                    <Coins className="h-4 w-4 text-yellow-500 group-hover:text-pixoo-pink transition-colors duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-purple/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <Badge
                    variant="secondary"
                    className="font-mono bg-gradient-to-r from-pixoo-pink/10 to-pixoo-purple/10 border-pixoo-pink/20 hover:from-pixoo-pink/20 hover:to-pixoo-purple/20 transition-all duration-300 hover:scale-105"
                  >
                    {freeCredits.balance}
                  </Badge>
                  {showAddButton && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0 border-pixoo-pink/30 bg-gradient-to-r from-pixoo-pink/10 to-pixoo-magenta/10 hover:from-pixoo-pink/20 hover:to-pixoo-magenta/20 hover:scale-110 transition-all duration-300"
                    >
                      <Plus className="h-3 w-3 text-pixoo-pink" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-gradient-to-br from-background to-background/95 border-pixoo-purple/20 backdrop-blur-sm">
            <div className="space-y-1 relative">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/5 via-pixoo-pink/5 to-pixoo-magenta/10 rounded-md -z-10" />

              {subscription && credits ? (
                <>
                  <p className="font-medium bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
                    {t("yourCredits")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("currentBalance", { balance })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("totalEarned")}:{" "}
                    <span className="text-green-600 font-medium">
                      {credits.totalEarned}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("totalSpent")}:{" "}
                    <span className="text-red-600 font-medium">
                      {credits.totalSpent}
                    </span>
                  </p>
                </>
              ) : freeCredits ? (
                <>
                  <p className="font-medium bg-gradient-to-r from-pixoo-pink to-pixoo-magenta bg-clip-text text-transparent">
                    {t("freeCredits")}: {freeCredits.balance}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("onlyForPixooFree")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {freeCredits.canRenew
                      ? t("renewalAvailable")
                      : t("nextRenewalIn", {
                          hours: Math.floor(freeCredits.hoursUntilRenewal),
                        })}
                  </p>
                </>
              ) : (
                <p>{t("loginToSeeCredits")}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`space-y-4 relative ${className}`}>
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/5 via-pixoo-pink/5 to-pixoo-magenta/10 rounded-2xl -z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent rounded-2xl -z-10" />

      {/* Floating decorative elements */}
      <div className="absolute top-4 right-8 w-8 h-8 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-magenta/20 rounded-full blur-lg animate-pulse" />
      <div className="absolute bottom-6 left-6 w-6 h-6 bg-gradient-to-br from-pixoo-purple/15 to-pixoo-pink/15 rounded-full blur-md animate-pulse delay-500" />

      <div className="flex items-center justify-between relative z-10">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-foreground via-pixoo-purple to-pixoo-magenta bg-clip-text text-transparent">
          {subscription ? t("yourCredits") : t("freeCredits")}
        </h3>
        {showAddButton && subscription && (
          <Button
            size="sm"
            variant="outline"
            className="border-pixoo-magenta/30 bg-gradient-to-r from-pixoo-magenta/10 to-pixoo-pink/10 hover:from-pixoo-magenta/20 hover:to-pixoo-pink/20 hover:scale-105 transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2 text-pixoo-magenta" />
            {t("add")}
          </Button>
        )}
      </div>

      <div className="grid gap-4 relative z-10">
        {subscription && credits ? (
          <>
            <div className="flex items-center gap-3 p-4 border border-pixoo-purple/20 rounded-lg bg-gradient-to-br from-background to-background/50 backdrop-blur-sm hover:shadow-lg hover:shadow-pixoo-purple/10 transition-all duration-300 group">
              <div className="relative">
                <Coins className="h-8 w-8 text-yellow-500 group-hover:text-pixoo-magenta transition-colors duration-300" />
                <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
                  {balance}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("creditsAvailable")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-green-200/50 rounded-lg text-center bg-gradient-to-br from-green-50/50 to-background hover:shadow-md hover:shadow-green-500/10 transition-all duration-300 group">
                <p className="text-lg font-semibold text-green-600 group-hover:scale-110 transition-transform duration-300">
                  {credits.totalEarned}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("totalEarned")}
                </p>
              </div>
              <div className="p-3 border border-red-200/50 rounded-lg text-center bg-gradient-to-br from-red-50/50 to-background hover:shadow-md hover:shadow-red-500/10 transition-all duration-300 group">
                <p className="text-lg font-semibold text-red-600 group-hover:scale-110 transition-transform duration-300">
                  {credits.totalSpent}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("totalSpent")}
                </p>
              </div>
            </div>

            {credits.recentTransactions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
                  {t("recentTransactions")}
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {credits.recentTransactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between text-xs p-2 bg-gradient-to-r from-muted/50 to-muted/30 rounded hover:from-pixoo-purple/10 hover:to-pixoo-magenta/10 transition-all duration-300 hover:scale-[1.02]"
                    >
                      <span className="truncate flex-1">
                        {transaction.description}
                      </span>
                      <span
                        className={`font-mono ${
                          transaction.amount > 0
                            ? "text-green-600"
                            : "text-red-600"
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
            <div className="flex items-center gap-3 p-4 border border-pixoo-pink/20 rounded-lg bg-gradient-to-br from-background to-background/50 backdrop-blur-sm hover:shadow-lg hover:shadow-pixoo-pink/10 transition-all duration-300 group">
              <div className="relative">
                <Coins className="h-8 w-8 text-yellow-500 group-hover:text-pixoo-pink transition-colors duration-300" />
                <div className="absolute inset-0 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-purple/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold bg-gradient-to-r from-pixoo-pink to-pixoo-magenta bg-clip-text text-transparent">
                  {freeCredits.balance}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("creditsAvailable")}
                </p>
              </div>
            </div>

            <div className="p-4 border border-blue-200/50 rounded-lg bg-gradient-to-br from-blue-50/50 to-background relative overflow-hidden group hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
              {/* Background decorative element */}
              <div className="absolute top-2 right-2 w-4 h-4 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-purple/20 rounded-full blur-sm animate-pulse" />

              <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
                  <p className="text-sm font-medium text-blue-800 bg-gradient-to-r from-blue-800 to-pixoo-purple bg-clip-text text-transparent">
                    {t("importantInfo")}
                  </p>
                </div>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li className="hover:text-pixoo-purple transition-colors duration-300">
                    {t("validOnlyForFluxSchnell")}
                  </li>
                  <li className="hover:text-pixoo-purple transition-colors duration-300">
                    {t("renewedEvery24Hours")}
                  </li>
                  <li className="hover:text-pixoo-purple transition-colors duration-300">
                    {freeCredits.canRenew
                      ? t("renewalAvailableNow")
                      : t("nextRenewalInHours", {
                          hours: freeCredits.hoursUntilRenewal,
                        })}
                  </li>
                </ul>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 border border-muted/50 rounded-lg text-center bg-gradient-to-br from-muted/20 to-background">
            <p className="text-muted-foreground">{t("loginToSeeCredits")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
