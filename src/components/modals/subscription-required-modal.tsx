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
import { Crown, Zap, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

  const plans = [
    {
      name: t('plans.basic.name'),
      price: t('plans.basic.price'),
      description: t('plans.basic.description'),
      features: [
        t('plans.basic.features.0'),
        t('plans.basic.features.1'),
        t('plans.basic.features.2'),
      ],
      icon: Zap,
      popular: false,
    },
    {
      name: t('plans.pro.name'),
      price: t('plans.pro.price'),
      description: t('plans.pro.description'),
      features: [
        t('plans.pro.features.0'),
        t('plans.pro.features.1'),
        t('plans.pro.features.2'),
        t('plans.pro.features.3'),
      ],
      icon: Crown,
      popular: true,
    },
  ];

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
        
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                    <Star className="h-3 w-3 mr-1" />
                    {t('popular')}
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    <IconComponent className={`h-8 w-8 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-3xl font-bold text-primary">{plan.price}</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-primary rounded-full" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
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