import { trackConversionGA4, trackConversionGoogleAds, trackConversionGTM } from '@/utils/tracking/google-integrations';
import { trackConversionKwai } from '@/utils/tracking/kwai-integrations';
import { trackConversionMeta } from '@/utils/tracking/meta-integrations';
import { trackConversionPinterest } from '@/utils/tracking/pinterest-integrations';
import { trackConversionTikTok } from '@/utils/tracking/tiktok-integrations';

export const IntegrationService = {
    trackConversion: async (provider, type_integration, infos) => {
        switch (provider) {
            case 'meta_pixel':
                return await trackConversionMeta(
                    infos.TOKEN,
                    infos.PIXEL_ID,
                    infos.LEAD,
                    infos.PRODUCT,
                    infos.EVENT_NAME,
                    type_integration
                );
            case 'pinterest_tag':
                return await trackConversionPinterest(
                    infos.ACCESS_TOKEN,
                    infos.AD_ACCOUNT_ID,
                    infos.LEAD,
                    infos.PRODUCT,
                    infos.EVENT_NAME,
                    type_integration
                );

            case 'google_tag_manager':
                return await trackConversionGTM(
                    infos.LEAD,
                    infos.PRODUCT,
                    infos.EVENT_NAME,
                    type_integration
                );
            case 'google_ads':
                return trackConversionGoogleAds(
                    infos.CONVERSION_ID,
                    infos.CONVERSION_LABEL,
                    infos.LEAD,
                    infos.PRODUCT,
                    infos.EVENT_NAME
                );
            case 'google_analytics':
                return trackConversionGA4(
                    infos.LEAD,
                    infos.PRODUCT,
                    infos.EVENT_NAME
                );

            case 'tiktok_pixel':
                return await trackConversionTikTok(
                    infos.TOKEN,
                    infos.PIXEL_ID,
                    infos.LEAD,
                    infos.PRODUCT,
                    infos.EVENT_NAME,
                    type_integration
                );

            case 'kwai_pixel':
                return await trackConversionKwai(
                    infos.TOKEN,
                    infos.PIXEL_ID,
                    infos.LEAD,
                    infos.PRODUCT,
                    infos.EVENT_NAME,
                    type_integration
                );

            default:
                throw new Error('Integration type not supported');
        }
    }
};
