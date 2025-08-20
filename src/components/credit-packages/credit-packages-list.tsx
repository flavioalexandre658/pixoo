"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import {
  Crown,
  Zap,
  Loader2,
  Sparkles,
  Coins,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { getCreditPackagesByCurrency } from "@/actions/credit-packages/get/get-credit-packages-by-currency.action";
import { createCreditPackageCheckout } from "@/actions/checkout/create/create-credit-package-checkout.action";
import { PixooLoading } from "@/components/ui/pixoo-loading";

interface CreditPackage {
  id: string;
  code: string;
  name: string;
  description: string | null;
  credits: number;
  priceInCents: number;
  currency: string;
  isActive: string;
  isPopular: string;
  priceFormatted: string;
  lookupKey: string;
}

interface CreditPackagesListProps {
  currency: "USD" | "BRL";
  onPackageSelect?: (packageData: CreditPackage) => void;
  showSelectButton?: boolean;
  buttonText?: string;
  className?: string;
  onCheckoutSuccess?: () => void;
}

export function CreditPackagesList({
  currency,
  onPackageSelect,
  showSelectButton = true,
  buttonText,
  className = "",
  onCheckoutSuccess,
}: CreditPackagesListProps) {
  const t = useTranslations("creditPackages");
  const { data: session } = useSession();
  const router = useRouter();
  const [packages, setPackages] = useState<CreditPackage[]>([]);

  // Action para buscar pacotes
  const { execute: executeGetPackages, isExecuting: isLoadingPackages } =
    useAction(getCreditPackagesByCurrency, {
      onSuccess: (result) => {
        if (result.data?.success) {
          setPackages(result.data.data || []);
        } else {
          toast.error(t("loadingError"));
        }
      },
      onError: () => {
        toast.error(t("loadingError"));
      },
    });

  // Action para criar checkout
  const { execute: executeCreateCheckout, isExecuting: isCreatingCheckout } =
    useAction(createCreditPackageCheckout, {
      onSuccess: (result) => {
        if (result.data?.success && result.data.data?.url) {
          // Chamar callback de sucesso antes do redirecionamento
          if (onCheckoutSuccess) {
            onCheckoutSuccess();
          }
          // Redirecionar para o Stripe Checkout
          window.location.href = result.data.data.url;
        } else {
          toast.error(t("checkoutError"));
        }
      },
      onError: (error) => {
        console.error("Erro no checkout:", error);
        toast.error(t("paymentError"));
      },
    });

  useEffect(() => {
    executeGetPackages({ currency });
  }, [currency, executeGetPackages]);

  const handleCreateCheckout = (packageCode: string) => {
    if (!session?.user) {
      router.push("/sign-in");
      return;
    }

    executeCreateCheckout({
      packageCode,
      currency,
    });
  };

  const handlePackageAction = (pkg: CreditPackage) => {
    if (onPackageSelect) {
      onPackageSelect(pkg);
    } else {
      handleCreateCheckout(pkg.code);
    }
  };

  // Ícones e estilos para diferentes tipos de pacotes
  const getPackageConfig = (code: string) => {
    switch (code) {
      case "starter":
        return {
          icon: Coins,
          gradient: "from-pixoo-purple/10 to-pixoo-magenta/10",
          borderColor: "border-pixoo-purple/30",
          iconColor: "text-pixoo-purple",
          badgeColor: "bg-pixoo-purple text-white",
        };
      case "premium":
      case "advanced":
        return {
          icon: Crown,
          gradient: "from-pixoo-pink/10 to-pixoo-magenta/10",
          borderColor: "border-pixoo-pink/30",
          iconColor: "text-pixoo-pink",
          badgeColor: "bg-pixoo-pink text-white",
        };
      default:
        return {
          icon: Sparkles,
          gradient: "from-pixoo-dark/5 to-pixoo-purple/5",
          borderColor: "border-pixoo-dark/20",
          iconColor: "text-pixoo-dark",
          badgeColor: "bg-pixoo-dark text-white",
        };
    }
  };

  if (isLoadingPackages) {
    return (
      <div className={className}>
        <PixooLoading size="md" />
      </div>
    );
  }

  if (!packages.length) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-pixoo-purple/20 to-pixoo-pink/20 flex items-center justify-center">
            <Coins className="w-8 h-8 text-pixoo-purple" />
          </div>
          <p className="text-muted-foreground text-lg">
            {t("noPackagesAvailable")}
          </p>
        </div>
      </div>
    );
  }

  // Layout da grade adaptado para pacotes de créditos
  const gridCols = "grid md:grid-cols-2 lg:grid-cols-3 gap-6";

  return (
    <div className={`${gridCols} ${className}`}>
      {packages.map((pkg) => {
        const config = getPackageConfig(pkg.code);
        const IconComponent = config.icon;
        const isPopular = pkg.isPopular === "true";

        return (
          <div key={pkg.id} className="relative pt-4">
            <Card
              className={`relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group overflow-hidden ${isPopular
                ? "border-pixoo-pink shadow-lg shadow-pixoo-pink/20 scale-105 ring-2 ring-pixoo-pink/20"
                : `${config.borderColor} hover:border-pixoo-purple/40`
                }`}
            >
              {/* Gradient Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-50`}
              />

              {/* Popular Badge */}
              {isPopular && (
                <Badge className="absolute top-[4] left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pixoo-pink to-pixoo-magenta text-white shadow-lg z-10 px-3 py-1">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {t("popular")}
                </Badge>
              )}

              <CardHeader className="text-center relative z-10 pb-4 pt-6">
                {/* Icon with enhanced styling */}
                <div className="flex justify-center mb-4">
                  <div
                    className={`p-3 rounded-2xl bg-gradient-to-br ${config.gradient} border ${config.borderColor} shadow-sm`}
                  >
                    <IconComponent className={`h-8 w-8 ${config.iconColor}`} />
                  </div>
                </div>

                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pixoo-dark to-pixoo-purple bg-clip-text text-transparent">
                  {pkg.name}
                </CardTitle>

                <CardDescription className="min-h-[3rem] text-muted-foreground leading-relaxed">
                  {pkg.description}
                </CardDescription>

                {/* Price with enhanced styling */}
                <div className="mt-4">
                  <div className="text-4xl font-bold bg-gradient-to-r from-pixoo-purple to-pixoo-pink bg-clip-text text-transparent">
                    {pkg.priceFormatted}
                  </div>
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-pixoo-purple/10 border border-pixoo-purple/20">
                    <Zap className="w-4 h-4 text-pixoo-purple mr-1" />
                    <span className="text-sm font-medium text-pixoo-purple">
                      {pkg.credits} {t("credits")}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 relative z-10">
                {/* Action Button */}
                {showSelectButton && (
                  <Button
                    onClick={() => handlePackageAction(pkg)}
                    disabled={isCreatingCheckout}
                    className={`w-full h-12 font-semibold transition-all duration-300 ${isPopular
                      ? "bg-gradient-to-r from-pixoo-pink to-pixoo-magenta hover:from-pixoo-pink/90 hover:to-pixoo-magenta/90 text-white shadow-lg hover:shadow-xl"
                      : "bg-gradient-to-r from-pixoo-purple to-pixoo-dark hover:from-pixoo-purple/90 hover:to-pixoo-dark/90 text-white shadow-md hover:shadow-lg"
                      }`}
                    size="lg"
                  >
                    {isCreatingCheckout ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("processing")}
                      </>
                    ) : (
                      <>
                        <Coins className="h-4 w-4 mr-2" />
                        {buttonText || t("buyNow")}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
