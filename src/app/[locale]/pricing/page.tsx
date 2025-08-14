import { getTranslations } from 'next-intl/server';
import { PageContainer } from '@/components/ui/page-container/page-container';
import { PlansList } from '@/components/plans/plans-list';
import { Crown, Sparkles } from 'lucide-react';

interface PricingPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale } = await params;
  const t = await getTranslations('pricing');

  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Crown className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Features Highlight */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="text-center p-6 bg-card rounded-lg border">
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">{t('features.fastGeneration.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('features.fastGeneration.description')}
            </p>
          </div>
          <div className="text-center p-6 bg-card rounded-lg border">
            <Crown className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">{t('features.premiumQuality.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('features.premiumQuality.description')}
            </p>
          </div>
          <div className="text-center p-6 bg-card rounded-lg border">
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">{t('features.commercialLicense.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('features.commercialLicense.description')}
            </p>
          </div>
        </div>

        {/* Plans List */}
        <div className="mb-12">
          <PlansList 
            locale={locale}
            showSelectButton={true}
            buttonText="Começar Agora"
          />
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            {t('faq.title')}
          </h2>
          <div className="space-y-6">
            <div className="p-6 bg-card rounded-lg border">
              <h3 className="font-semibold mb-2">
                {t('faq.questions.cancel.question')}
              </h3>
              <p className="text-muted-foreground">
                {t('faq.questions.cancel.answer')}
              </p>
            </div>
            <div className="p-6 bg-card rounded-lg border">
              <h3 className="font-semibold mb-2">
                {t('faq.questions.credits.question')}
              </h3>
              <p className="text-muted-foreground">
                {t('faq.questions.credits.answer')}
              </p>
            </div>
            <div className="p-6 bg-card rounded-lg border">
              <h3 className="font-semibold mb-2">
                {t('faq.questions.commercial.question')}
              </h3>
              <p className="text-muted-foreground">
                {t('faq.questions.commercial.answer')}
              </p>
            </div>
            <div className="p-6 bg-card rounded-lg border">
              <h3 className="font-semibold mb-2">
                {t('faq.questions.free.question')}
              </h3>
              <p className="text-muted-foreground">
                {t('faq.questions.free.answer')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}