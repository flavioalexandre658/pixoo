import {
  hashSHA256,
  getFirstName,
  getRemainingName,
  getUserIP,
} from "@/utils/functions.util";

// Versão server-side do tracking Meta
export const trackConversionMetaServer = async (
  TOKEN: string,
  PIXEL_ID: string,
  LEAD: any,
  PRODUCT: any,
  EVENT_NAME: string
) => {
  const API_VERSION = "v20.0";
  const endpoint = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${TOKEN}`;

  try {
    const content = {
      data: [
        {
          event_name: EVENT_NAME,
          event_time: Math.floor(new Date().getTime() / 1000),
          action_source: "website",
          user_data: {
            em: LEAD.email ? [await hashSHA256(LEAD.email)] : undefined,
            ph: LEAD.phone ? [await hashSHA256(LEAD.phone)] : undefined,
            fn: LEAD.name
              ? [await hashSHA256(getFirstName(LEAD.name))]
              : undefined,
            ln: LEAD.name
              ? [await hashSHA256(getRemainingName(LEAD.name))]
              : undefined,
            external_id: [LEAD.uuid],
            client_ip_address: await getUserIP(),
          },
          custom_data: {
            currency: "BRL",
            value: PRODUCT.price,
          },
        },
      ],
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(content),
    });

    if (!response.ok) {
      throw new Error("Erro ao enviar conversão para Meta API");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro no tracking Meta:", error);
    throw error;
  }
};

// Versão server-side do tracking Google Ads
export const trackConversionGoogleAdsServer = async (
  CONVERSION_ID: string,
  CONVERSION_LABEL: string,
  LEAD: any,
  PRODUCT: any
) => {
  // Para Google Ads server-side, você precisará usar a Google Ads API
  // ou Enhanced Conversions API
  console.log("Google Ads tracking (server-side):", {
    conversionId: CONVERSION_ID,
    conversionLabel: CONVERSION_LABEL,
    value: PRODUCT.price,
    transactionId: LEAD.uuid,
  });
};
