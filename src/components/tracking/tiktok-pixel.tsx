"use client";
import Script from 'next/script';

const TikTokPixel = ({ TIKTOK_PIXEL_ID }: { TIKTOK_PIXEL_ID: string }) => {
  if (!TIKTOK_PIXEL_ID) return null;

  return (
    <>
      {/* Script do TikTok Pixel (no head) */}
      <Script id="tiktok-pixel" strategy="beforeInteractive">
        {`
          !function (w, d, t) {
            w.TiktokAnalyticsObject = t;
            var ttq = (w[t] = w[t] || []);
            ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
            ttq.setAndDefer = function (t, e) {
              t[e] = function () {
                t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
              };
            };
            for (var i = 0; i < ttq.methods.length; i++) {
              ttq.setAndDefer(ttq, ttq.methods[i]);
            }
            ttq.instance = function (t) {
              var e = ttq._i[t] || [];
              for (var i = 0; i < ttq.methods.length; i++) {
                ttq.setAndDefer(e, ttq.methods[i]);
              }
              return e;
            };
            ttq.load = function (e, n) {
              var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
              (ttq._i = ttq._i || {}),
                (ttq._i[e] = []),
                (ttq._i[e]._u = i),
                (ttq._t = ttq._t || {}),
                (ttq._t[e] = +new Date()),
                (ttq._o = ttq._o || {}),
                (ttq._o[e] = n || {});
              var o = document.createElement("script");
              (o.type = "text/javascript"),
                (o.async = !0),
                (o.src = i + "?sdkid=" + e + "&lib=" + t);
              var a = document.getElementsByTagName("script")[0];
              a.parentNode.insertBefore(o, a);
            };
            ttq.load('${TIKTOK_PIXEL_ID}');
            ttq.page();
          }(window, document, 'ttq');
        `}
      </Script>

      {/* NoScript para TikTok Pixel */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${TIKTOK_PIXEL_ID}&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
};

export default TikTokPixel;
