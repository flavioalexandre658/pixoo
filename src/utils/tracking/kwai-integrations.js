
export const trackConversionKwai = async (TOKEN, PIXEL_ID, LEAD, PRODUCT, EVENT_NAME, TYPE) => {
    if (TYPE === 'api') {
        await conversionAPI(TOKEN, PIXEL_ID, LEAD, PRODUCT, EVENT_NAME);
    } else if (TYPE === 'browser') {
        conversionBROWSER(LEAD, PRODUCT, EVENT_NAME);
    }
};

const conversionAPI = async (TOKEN, PIXEL_ID, LEAD, PRODUCT, EVENT_NAME) => {
    const endpoint = `https://ad.kwai.com/openapi/v1.0/track`;

    const content = {
        "pixel_id": PIXEL_ID,
        "event_name": EVENT_NAME,
        "event_time": Math.floor(Date.now() / 1000),
        "user_data": {
            "external_id": LEAD.uuid,
            "email": LEAD.email,
            "phone_number": LEAD.phone,
            "ip": await getUserIP(),
            "user_agent": navigator.userAgent
        },
        "custom_data": {
            "value": PRODUCT.price,
            "currency": "BRL"
        }
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify(content)
        });

        const result = await response.json();
        console.log("Kwai Conversion API Response:", result);
    } catch (error) {
        console.error('Erro ao enviar evento para Kwai API:', error);
    }
};

const conversionBROWSER = (LEAD, PRODUCT, EVENT_NAME) => {
    if (typeof window !== 'undefined') {
        window.kwaiq.track(EVENT_NAME, {
            event_name: EVENT_NAME,
            conversion_value: PRODUCT.price,
            currency: "BRL",
            external_id: LEAD.uuid
        });
    }
};
