
export const trackConversionTikTok = async (TOKEN, PIXEL_ID, LEAD, PRODUCT, EVENT_NAME, TYPE) => {
    if (TYPE === 'api') {
        await conversionAPI(TOKEN, PIXEL_ID, LEAD, PRODUCT, EVENT_NAME);
    } else if (TYPE === 'browser') {
        conversionBROWSER(LEAD, PRODUCT, EVENT_NAME);
    }
};

const conversionAPI = async (TOKEN, PIXEL_ID, LEAD, PRODUCT, EVENT_NAME) => {
    const endpoint = `https://business-api.tiktok.com/open_api/v1.3/event/track/`;

    const content = {
        "pixel_code": PIXEL_ID,
        "event": EVENT_NAME,
        "timestamp": new Date().toISOString(),
        "user": {
            "external_id": LEAD.uuid,
            "email": LEAD.email,
            "phone_number": LEAD.phone,
            "ip": await getUserIP(),
            "user_agent": navigator.userAgent
        },
        "properties": {
            "currency": "BRL",
            "value": PRODUCT.price
        }
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Access-Token': TOKEN
            },
            body: JSON.stringify(content)
        });

        const result = await response.json();
        console.log("TikTok Conversion API Response:", result);
    } catch (error) {
        console.error('Erro ao enviar evento para o TikTok API:', error);
    }
};

const conversionBROWSER = (LEAD, PRODUCT, EVENT_NAME) => {
    if (typeof window !== 'undefined') {
        window.ttq.track(EVENT_NAME, {
            contents: [{ id: LEAD.uuid, price: PRODUCT.price }],
            value: PRODUCT.price,
            currency: "BRL"
        });
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
