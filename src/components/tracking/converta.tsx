import Script from 'next/script';

const Converta = () => {
  return (
    <>
      {/* Script de detecção do userAgent */}
      <Script id="converta-script" strategy="beforeInteractive">
        {`
          var sUsrAg = navigator.userAgent;
          
          if (sUsrAg.indexOf("converta") > -1) {
            window.location.href = "https://tomemorize.com/sign-in";
          } else {
            // sugestão: avisar que determinado cupom só pode ser usado no app.
          }
        `}
      </Script>
    </>
  );
};

export default Converta;
