"use client";

import React, { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlansList } from "@/components/plans/plans-list";
import { CreditPackagesList } from "@/components/credit-packages/credit-packages-list";

interface SubscriptionRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "packages" | "plans";
}

export function SubscriptionRequiredModal({
  isOpen,
  onClose,
  defaultTab = "packages",
}: SubscriptionRequiredModalProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const t = useTranslations("subscriptionRequired");

  // Detectar moeda e locale baseado na localização ou preferência do usuário
  const currency: "USD" | "BRL" = "BRL"; // Você pode implementar lógica para detectar automaticamente
  const locale = "pt"; // Locale para o PlansList

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full max-w-none max-h-none m-0 rounded-none md:w-[95vw] md:h-[95vh] md:max-w-[1000px] md:max-h-[90vh] md:m-auto md:rounded-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "packages" | "plans")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="packages">{t("tabs.packages")}</TabsTrigger>
            <TabsTrigger value="plans">{t("tabs.plans")}</TabsTrigger>
          </TabsList>

          <TabsContent value="packages" className="mt-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  {t("packagesSection.title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("packagesSection.description")}
                </p>
              </div>
              <CreditPackagesList currency={currency} />
            </div>
          </TabsContent>

          <TabsContent value="plans" className="mt-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  {t("plansSection.title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("plansSection.description")}
                </p>
              </div>
              <PlansList locale={locale} excludeFreePlan={true} />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
