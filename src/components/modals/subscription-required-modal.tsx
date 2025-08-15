"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { PlansList } from "@/components/plans/plans-list";

interface SubscriptionRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function SubscriptionRequiredModal({
  isOpen,
  onClose,
  locale,
}: SubscriptionRequiredModalProps) {
  const t = useTranslations("subscriptionRequired");
  const router = useRouter();

  const handleViewPlans = () => {
    router.push(`/${locale}/pricing`);
    onClose();
  };

  const handleCheckoutSuccess = () => {
    // Fechar modal quando o checkout for iniciado com sucesso
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-sm sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl max-h-[90vh] overflow-y-auto p-0 border-pixoo-purple/20 shadow-2xl shadow-pixoo-purple/20">
        {/* Elementos decorativos flutuantes - responsivos */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-3 -left-3 sm:-top-6 sm:-left-6 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20 rounded-full blur-xl animate-pulse" />
          <div className="absolute -bottom-3 -right-3 sm:-bottom-6 sm:-right-6 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-purple/20 rounded-full blur-xl animate-pulse delay-1000" />
          <div className="hidden sm:block absolute top-1/4 right-1/4 w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-pixoo-magenta/10 to-pixoo-pink/10 rounded-full blur-lg animate-bounce delay-500" />
          <div className="hidden sm:block absolute bottom-1/4 left-1/4 w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-pixoo-purple/15 to-pixoo-magenta/15 rounded-full blur-lg animate-pulse delay-700" />
        </div>

        {/* Gradiente de fundo */}
        <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/5 via-transparent to-pixoo-pink/5" />

        <div className="relative p-3 sm:p-4 lg:p-6 xl:p-8 2xl:p-10 space-y-4 sm:space-y-6 lg:space-y-8">
          <DialogHeader className="space-y-3 sm:space-y-4 lg:space-y-6 text-center">
            <div className="mx-auto p-2 sm:p-3 lg:p-4 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 w-fit">
              <Crown className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-yellow-500" />
            </div>
            <DialogTitle className="text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-semibold bg-gradient-to-r from-foreground via-pixoo-purple to-pixoo-magenta bg-clip-text text-transparent px-2 text-center">
              {t("title")}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm lg:text-base xl:text-lg text-muted-foreground leading-relaxed max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl mx-auto px-2 text-center">
              {t("description")}
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            {/* Container com gradiente sutil */}
            <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/5 via-transparent to-pixoo-pink/5 rounded-xl" />
            <div className="relative p-2 sm:p-4 lg:p-6 xl:p-8 rounded-xl border border-pixoo-purple/20 backdrop-blur-sm">
              <PlansList
                locale={locale}
                onPlanSelect={undefined}
                showSelectButton={true}
                buttonText="Assinar Plano"
                className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 xl:gap-8"
                excludeFreePlan={true}
                onCheckoutSuccess={handleCheckoutSuccess}
              />
            </div>
          </div>

          <div className="flex justify-center pt-2 sm:pt-4 lg:pt-6">
            <Button
              onClick={handleViewPlans}
              size="lg"
              className="px-4 sm:px-6 lg:px-8 xl:px-10 h-10 sm:h-11 lg:h-12 xl:h-14 bg-gradient-to-r from-pixoo-purple to-pixoo-magenta hover:from-pixoo-purple/90 hover:to-pixoo-magenta/90 text-white font-medium transition-all duration-300 shadow-lg shadow-pixoo-purple/25 hover:shadow-xl hover:shadow-pixoo-purple/30 text-sm sm:text-base lg:text-lg"
            >
              <div className="p-1 rounded-md bg-white/20 mr-2">
                <Crown className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
              </div>
              {t("viewAllPlans")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
