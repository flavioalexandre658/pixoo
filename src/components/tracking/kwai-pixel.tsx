"use client";
import Script from 'next/script';

const KwaiPixel = ({ KWAI_PIXEL_ID }: { KWAI_PIXEL_ID: string }) => {
  if (!KWAI_PIXEL_ID) return null;

  return (
    <>
      {/* Script do Kwai Pixel (no head) */}
      <Script id="kwai-pixel" strategy="beforeInteractive">
        {`
          !function (w, d, s, l, i) {
            w[l] = w[l] || [];
            w[l].push({ 'kwai.start': new Date().getTime(), event: 'kwai.js' });
            var f = d.getElementsByTagName(s)[0],
              j = d.createElement(s),
              dl = l !== 'kwaiDataLayer' ? '&l=' + l : '';
            j.async = true;
            j.src = 'https://static.kwai.net/pixel/js/' + i + '/kwai.js';
            f.parentNode.insertBefore(j, f);
          }(window, document, 'script', 'kwaiDataLayer', '${KWAI_PIXEL_ID}');
        `}
      </Script>

      {/* NoScript para Kwai Pixel */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://static.kwai.net/pixel/img?kwai_id=${KWAI_PIXEL_ID}&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
};

export default KwaiPixel;
