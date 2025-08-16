"use client"
// components/PinterestTag.js
import Script from 'next/script';

const PinterestTag = ({ PINTEREST_TAG_ID }: { PINTEREST_TAG_ID: string }) => {
  if (!PINTEREST_TAG_ID) return null;

  return (
    <>
      {/* Script do Pinterest Tag (no head) */}
      <Script id="pinterest-tag" strategy="beforeInteractive">
        {`
          !function(e){if(!window.pintrk){window.pintrk = function() {
          window.pintrk.queue.push(Array.prototype.slice.call(arguments))};
          var n=window.pintrk;n.queue=[],n.version="3.0";
          var t=document.createElement("script");t.async=!0,t.src=e;
          var r=document.getElementsByTagName("script")[0];
          r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
          pintrk('load', '${PINTEREST_TAG_ID}');
          pintrk('track', 'pagevisit');
          pintrk('page');
        `}
      </Script>

      {/* Imagem do Pinterest Tag (noscript) */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://ct.pinterest.com/v3/?tid=${PINTEREST_TAG_ID}&event=init&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
};

export default PinterestTag;