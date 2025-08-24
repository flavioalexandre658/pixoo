import { useTranslations } from 'next-intl';

interface FAQSchemaProps {
  pageType?: 'aiImageGenerator' | 'landingPage';
  locale: string;
}

export default function FAQSchema({ pageType = 'landingPage', locale }: FAQSchemaProps) {
  const t = useTranslations(pageType === 'aiImageGenerator' ? 'aiImageGenerator.faq' : 'landingPage.faq');
  
  // Define FAQ items based on page type
  const faqItems = pageType === 'aiImageGenerator' ? [
    'whatIsAiImageGenerator',
    'howToUse', 
    'isFree',
    'imageQuality',
    'commercialUse',
    'bestPrompts',
    'supportedFormats',
    'generationTime'
  ] : [
    'howItWorks',
    'commercialUse', 
    'imageQuality',
    'technicalKnowledge',
    'editExisting'
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": t(`questions.${item}.question`),
      "acceptedAnswer": {
        "@type": "Answer",
        "text": t(`questions.${item}.answer`)
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(faqSchema)
      }}
    />
  );
}