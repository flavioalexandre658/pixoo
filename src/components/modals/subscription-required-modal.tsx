"use client";

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
import { PlansList } from '@/components/plans/plans-list';

interface SubscriptionRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function SubscriptionRequiredModal({ isOpen, onClose, locale }: SubscriptionRequiredModalProps) {
  const t = useTranslations('subscriptionRequired');
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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            <Crown className="h-6 w-6 text-yellow-500" />
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t('description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6">
          <PlansList 
            locale={locale}
            onPlanSelect={undefined}
            showSelectButton={true}
            buttonText="Assinar Plano"
            className="grid-cols-1 md:grid-cols-2"
            excludeFreePlan={true}
            onCheckoutSuccess={handleCheckoutSuccess}
          />
        </div>
        
        <div className="flex justify-center mt-6">
          <Button onClick={handleViewPlans} size="lg" className="px-8">
            <Crown className="h-4 w-4 mr-2" />
            {t('viewAllPlans')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
