import { getCookie, getFirstName, getRemainingName, hashSHA256 } from '@/utils/functions.util';
// integrations/metaIntegration.js
export const trackConversionMeta = async (TOKEN, PIXEL_ID, LEAD, PRODUCT, EVENT_NAME, TYPE) => {
    if (TYPE == 'api') {
        await conversionAPI(TOKEN, PIXEL_ID, LEAD, PRODUCT, EVENT_NAME)
    } else if (TYPE == 'browser') {
        conversionBROWSER(PIXEL_ID, LEAD, PRODUCT, EVENT_NAME)
    }
};

const conversionAPI = async (TOKEN, PIXEL_ID, LEAD, PRODUCT, EVENT_NAME) => {
    const API_VERSION = 'v20.0';
    const endpoint = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${TOKEN}`;

    await hashSHA256(PRODUCT.price)

    try {

        // Preparar o conteúdo da requisição
        let content = {
            "data": [
                {
                    "event_name": EVENT_NAME,
                    "event_time": Math.floor(new Date().getTime() / 1000), // Use o horário atual em segundos
                    "action_source": "website",
                    "user_data": {
                        "fbc": getCookie('_fbc'),
                        "fbp": getCookie('_fbp'),
                        "em": [
                            LEAD.email ? await hashSHA256(LEAD.email) : null
                        ],
                        "ph": [
                            LEAD.phone ? await hashSHA256(LEAD.phone) : null
                        ],
                        "fn": [
                            LEAD.name ? await hashSHA256(getFirstName(LEAD.name)) : null
                        ],
                        "ln": [
                            LEAD.name ? await hashSHA256(getRemainingName(LEAD.name)) : null
                        ],
                        "ct": [
                            LEAD.city ? await hashSHA256(LEAD.city) : null
                        ],
                        "st": [
                            LEAD.uf ? await hashSHA256(LEAD.uf) : null
                        ],
                        "zp": [
                            LEAD.zip_code ? await hashSHA256(LEAD.zip_code) : null
                        ],
                        "country": [
                            await hashSHA256('BRAZIL')
                        ],
                        "external_id": [
                            LEAD.uuid
                        ],
                        "client_user_agent": navigator.userAgent,
                        "client_ip_address": await getUserIP()

                    },
                    "custom_data": {
                        "currency": "BRL",
                        "value": PRODUCT.price
                    }
                }
            ],
            //"test_event_code": "TEST31005" // Use isso apenas para testes
        };

        // Fazer uma requisição POST para o endpoint do Facebook
        const postResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(content)
        });

        if (!postResponse.ok) throw new Error('Erro ao enviar a conversão para Meta API');

        const result = await postResponse.json();
        console.log(result);

    } catch (error) {
        console.log(error)
        console.error('Erro:', error);
    }
}

const conversionBROWSER = (PIXEL_ID, LEAD, PRODUCT, EVENT_NAME) => {
    if (typeof window != 'undefined') {
        window.fbq('trackSingle', PIXEL_ID, EVENT_NAME, {
            content_type: 'product',
            value: PRODUCT.price,
            currency: "BRL",
            num_items: PRODUCT.num_items,
            external_id: LEAD.uuid
        }); // Dispara o evento para o pixel com ID 'PIXEL_ID_1'
    }
}

const getUserIP = async () => {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        return data.ip;
    } catch (err) {
        return null;
    }
};
