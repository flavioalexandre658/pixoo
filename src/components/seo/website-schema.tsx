interface WebsiteSchemaProps {
  locale: string;
  pageType?: 'aiImageGenerator' | 'landingPage';
}

export default function WebsiteSchema({ locale, pageType = 'landingPage' }: WebsiteSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pixoo.ai';
  
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Pixoo",
    "description": pageType === 'aiImageGenerator' 
      ? "Free AI Image Generator - Create Professional Digital Art with Artificial Intelligence"
      : "AI Image Generator, Photo Editing, Digital Art and More",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Pixoo",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/images/icon.png`,
        "width": 512,
        "height": 512
      },
      "sameAs": [
        "https://twitter.com/pixoo_ai",
        "https://github.com/pixoo-ai"
      ]
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Pixoo",
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/images/icon.png`,
      "width": 512,
      "height": 512
    },
    "description": "Advanced AI platform for image generation and editing using cutting-edge artificial intelligence models.",
    "foundingDate": "2024",
    "sameAs": [
      "https://twitter.com/pixoo_ai",
      "https://github.com/pixoo-ai"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["English", "Portuguese", "Spanish"]
    }
  };

  const softwareApplicationSchema = pageType === 'aiImageGenerator' ? {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Pixoo AI Image Generator",
    "description": "Free AI image generator that creates professional digital art using advanced artificial intelligence models like Flux and Stable Diffusion.",
    "url": `${baseUrl}/${locale}/ai-image-generator`,
    "applicationCategory": "DesignApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free daily credits with paid plans available"
    },
    "featureList": [
      "AI Image Generation",
      "Multiple AI Models",
      "High Resolution Output",
      "Commercial License",
      "Fast Generation",
      "Multiple Art Styles"
    ],
    "screenshot": `${baseUrl}/images/ai-generator-screenshot.png`,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1250",
      "bestRating": "5",
      "worstRating": "1"
    }
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema)
        }}
      />
      {softwareApplicationSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationSchema)
          }}
        />
      )}
    </>
  );
}