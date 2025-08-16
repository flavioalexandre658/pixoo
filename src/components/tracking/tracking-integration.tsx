"use client";
import { Fragment } from "react";

import GA from "@/components/tracking/ga";
import GoogleAdsPixel from "@/components/tracking/google-ads-pixel";
import GTM from "@/components/tracking/gtm";
import KwaiPixel from "@/components/tracking/kwai-pixel";
import MetaPixel from "@/components/tracking/meta-pixel";
import TiktokPixel from "@/components/tracking/tiktok-pixel";

const TrackingIntegrations = ({ integrationsData }: { integrationsData: any[] }) => {
  if (!integrationsData || integrationsData.length === 0) return null;

  return (
    <>
      {integrationsData.map((integration, index) => {
        if (integration.service !== "tracking") return null;

        return (
          <Fragment key={index}>
            {integration.provider === "google_tag_manager" && (
              <GTM GTM_ID={integration.config?.container_id} />
            )}

            {integration.provider === "meta_pixel" && (
              <MetaPixel META_PIXEL_ID={integration.config?.pixel_id} />
            )}

            {integration.provider === "kwai_pixel" && (
              <KwaiPixel KWAI_PIXEL_ID={integration.config?.pixel_id} />
            )}

            {integration.provider === "tiktok_pixel" && (
              <TiktokPixel TIKTOK_PIXEL_ID={integration.config?.pixel_id} />
            )}

            {integration.provider === "google_analytics" && (
              <GA GA_ID={integration.config?.google_analytics_metric} />
            )}

            {integration.provider === "google_ads" && (
              <GoogleAdsPixel GOOGLE_ADS_ID={integration.config?.google_ads_conversion_id} />
            )}

          </Fragment>
        );
      })}
    </>
  );
};

export default TrackingIntegrations;
