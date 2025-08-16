import Script from 'next/script';
import { useEffect } from 'react';

const GoogleRatingBadge = ({ merchantId }: { merchantId: string }) => {
  useEffect(() => {
    // Função global necessária para o carregamento do badge
    (window as any).renderBadge = () => {
      const ratingBadgeContainer = document.createElement('div');
      document.body.appendChild(ratingBadgeContainer);

      (window as any).gapi?.load('ratingbadge', () => {
        (window as any).gapi.ratingbadge.render(ratingBadgeContainer, { merchant_id: merchantId });
      });
    };
  }, [merchantId]);

  return (
    <Script
      id="google-rating-badge-script"
      strategy="afterInteractive"
      src="https://apis.google.com/js/platform.js?onload=renderBadge"
      async
      defer
    />
  );
};

export default GoogleRatingBadge;