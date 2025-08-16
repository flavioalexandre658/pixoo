import { getCookie, getFirstName, getRemainingName, hashSHA256 } from '@/utils/functions.util';

// integrations/pinterestIntegration.js
export const trackConversionPinterest = async (ACCESS_TOKEN, AD_ACCOUNT_ID, LEAD, PRODUCT, EVENT_NAME, TYPE, USER_AGENT) => {
    if (TYPE === 'api') {
        await conversionAPI(ACCESS_TOKEN, AD_ACCOUNT_ID, LEAD, PRODUCT, EVENT_NAME, USER_AGENT);
    } else if (TYPE === 'browser') {
        conversionBROWSER(AD_ACCOUNT_ID, LEAD, PRODUCT, EVENT_NAME);
    }
};

const conversionAPI = async (ACCESS_TOKEN, AD_ACCOUNT_ID, LEAD, PRODUCT, EVENT_NAME, USER_AGENT) => {
    const API_VERSION = 'v5';
    const endpoint = `https://api.pinterest.com/${API_VERSION}/ad_accounts/${AD_ACCOUNT_ID}/events`;

    try {
        // Eventos padrão suportados pelo Pinterest
        const eventMap = {
            'purchase': 'checkout',
            'purchase-redasoni': 'checkout',
            'lead': 'lead',
            'view': 'page_visit',
            'add_to_cart': 'add_to_cart'
        };
        const pinterestEvent = eventMap[EVENT_NAME.toLowerCase()] || EVENT_NAME;

        let content = {
            "data": [
                {
                    "event_name": 'checkout', // Garantir que seja um evento válido como "checkout"
                    "event_time": Math.floor(new Date().getTime() / 1000),
                    "action_source": "website",
                    "event_id": `${LEAD.uuid || 'unknown'}-${Date.now()}`, // ID único
                    "opt_out": false,
                    "partner_name": "Moriz",
                    "user_data": {
                        "hashed_maids": LEAD.mobile_ad_id ? [await hashSHA256(LEAD.mobile_ad_id)] : undefined, // Adicionado suporte para hashed_maids
                        "em": LEAD.email ? [await hashSHA256(LEAD.email.toLowerCase())] : undefined,
                        "ph": LEAD.phone ? [await hashSHA256(LEAD.phone)] : undefined,
                        "fn": LEAD.name ? [await hashSHA256(getFirstName(LEAD.name).toLowerCase())] : undefined,
                        "ln": LEAD.name ? [await hashSHA256(getRemainingName(LEAD.name).toLowerCase())] : undefined,
                        "zp": LEAD.zip_code ? [await hashSHA256(LEAD.zip_code)] : undefined,
                        "ct": LEAD.city ? [await hashSHA256(LEAD.city.toLowerCase())] : undefined,
                        "st": LEAD.uf ? [await hashSHA256(LEAD.uf.toLowerCase())] : undefined,
                        "country": [await hashSHA256('br')],
                        "external_id": LEAD.uuid ? [await hashSHA256(LEAD.uuid)] : undefined, // Hash do external_id
                        "client_ip_address": await getUserIP(),
                        "client_user_agent": USER_AGENT
                    },
                    "custom_data": {
                        "currency": "BRL",
                        "value": PRODUCT.price ? String(PRODUCT.price) : "0.00",
                        "content_ids": PRODUCT.id ? [PRODUCT.id] : undefined,
                        "content_name": PRODUCT.name || undefined,
                        "content_category": PRODUCT.category || undefined,
                        "contents": [
                            {
                                "quantity": PRODUCT.num_items || 1,
                                "item_price": PRODUCT.price ? String(PRODUCT.price) : "0.00"
                            }
                        ],
                        "num_items": PRODUCT.num_items || 1,
                        "order_id": PRODUCT.uuid || LEAD.uuid
                    }
                }
            ]
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(content)
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(`Erro ao enviar conversão para Pinterest API: ${JSON.stringify(result)}`);
        }

        console.log('Pinterest Conversion API Success:', result);
        return result;

    } catch (error) {
        console.error('Erro Pinterest API:', error);
        throw error;
    }
};

const conversionBROWSER = (AD_ACCOUNT_ID, LEAD, PRODUCT, EVENT_NAME) => {
    if (typeof window !== 'undefined' && window.pintrk) {
        const eventData = {
            value: PRODUCT.price,
            currency: 'BRL',
            order_id: LEAD.uuid,
            num_items: PRODUCT.num_items || 1
        };

        // Mapear eventos para o Pinterest Tag
        const eventMap = {
            'purchase': 'checkout',
            'purchase-redasoni': 'checkout',
            'lead': 'lead',
            'view': 'pagevisit',
            'add_to_cart': 'addtocart'
        };

        window.pintrk('track', 'checkout', eventData);
        console.log('Pinterest Browser Event Tracked:', 'checkout', eventData);
    } else {
        console.warn('Pinterest Tag não está carregado');
    }
};

const getUserIP = async () => {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        return data.ip;
    } catch (err) {
        return null;
    }
};