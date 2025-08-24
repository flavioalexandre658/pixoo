"use client";
import Script from "next/script";

interface GoogleAdsPixelProps {
  GOOGLE_ADS_ID?: string;
}

export function GoogleAdsPixel({ GOOGLE_ADS_ID }: GoogleAdsPixelProps) {
  // Usar a prop passada ou fallback para a variável de ambiente
  const googleAdsId = GOOGLE_ADS_ID || process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

  if (!googleAdsId) {
    return null;
  }

  return (
    <>
      <Script
        id="google-ads-gtag"
        src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-ads-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${googleAdsId}', {
              allow_enhanced_conversions: true,
              send_page_view: false
            });
          `,
        }}
      />
    </>
  );
}

export default GoogleAdsPixel;
