import Script from 'next/script';

const GA = ({ GA_ID = "" }) => {
  if (!GA_ID) return null; // Se não houver GA_ID, não renderize nada

  return (
    <>
      {/* Script do GA (carregado de forma assíncrona) */}
      <Script
        id="ga-script"
        strategy="beforeInteractive" // Carrega após a página ser interativa
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />

      {/* Configuração do GA */}
      <Script id="ga-config" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
};

export default GA;