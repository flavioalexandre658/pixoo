import { useTranslations } from 'next-intl';
import { AppLayout } from '@/components/layout/app-layout';
import { ImageGeneratorForm } from './_components/image-generator-form';

export default function Home() {
  const t = useTranslations('imageGeneration');

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            Generate stunning images with AI using advanced Flux models
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Form */}
          <div className="space-y-6">
            <ImageGeneratorForm />
          </div>
          
          {/* Right side - Preview */}
          <div className="flex items-center justify-center min-h-[400px] bg-muted rounded-lg border-2 border-dashed">
            <div className="text-center text-muted-foreground">
              <p className="text-lg">{t('noImageGenerated')}</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
