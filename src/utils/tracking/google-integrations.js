import { getCookie } from '@/utils/functions.util';
export const trackConversionGTM = async (LEAD, PRODUCT, EVENT_NAME, TYPE) => {
    if (TYPE == 'api') {
        await conversionAPI(LEAD, PRODUCT, EVENT_NAME)
    }
};

const conversionAPI = async (LEAD, PRODUCT, EVENT_NAME) => {
    if (typeof window != 'undefined') {
        //API
        window.dataLayer?.push({
            'event': EVENT_NAME,
            'gclid': getCookie('gclid'),
            'conversionValue': PRODUCT.price,
            'ecommerce': {
                'purchase': {
                    'actionField': {
                        'id': PRODUCT.id,
                        'affiliation': 'Moriz',
                        'revenue': PRODUCT.price,
                        'name': LEAD.name,
                        'email': LEAD.email, // Inclua o e-mail do comprador
                        'phone': LEAD.phone, // Inclua o telefone do comprador
                        'zipCode': LEAD.zip_code, // Inclua o telefone do comprador
                        'uf': LEAD.uf,
                        'street': LEAD.street,
                        'country': 'Brazil',
                        'city': LEAD.city
                    },
                    'products': [
                        {
                            'id': PRODUCT.uuid,
                            'name': PRODUCT.name,
                            'price': PRODUCT.price,
                            'category': 'Serviço',
                        }
                        // Adicione mais produtos, se houver
                    ]
                }
            }
        });
    }
}
export const trackConversionGA4 = (LEAD, PRODUCT, EVENT_NAME) => {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag('event', EVENT_NAME, {
            transaction_id: LEAD.uuid,
            gclid: getCookie('gclid'),
            value: PRODUCT.price,
            currency: "BRL",
            items: [{
                id: PRODUCT.id,
                name: PRODUCT.name,
                quantity: PRODUCT.num_items
            }],
            'ecommerce': {
                'purchase': {
                    'actionField': {
                        'id': PRODUCT.id,
                        'affiliation': 'Moriz',
                        'revenue': PRODUCT.price,
                        'name': LEAD.name,
                        'email': LEAD.email, // Inclua o e-mail do comprador
                        'phone': LEAD.phone, // Inclua o telefone do comprador
                        'zipCode': LEAD.zip_code, // Inclua o telefone do comprador
                        'uf': LEAD.uf,
                        'street': LEAD.street,
                        'country': 'Brazil',
                        'city': LEAD.city
                    },
                    'products': [
                        {
                            'id': PRODUCT.uuid,
                            'name': PRODUCT.name,
                            'price': PRODUCT.price,
                            'category': 'Serviço',
                        }
                        // Adicione mais produtos, se houver
                    ]
                }
            }
        });
    }
};

export const trackConversionGoogleAds = (CONVERSION_ID, CONVERSION_LABEL, LEAD, PRODUCT, EVENT_NAME) => {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
        const conversionId = String(CONVERSION_ID).trim();
        const conversionLabel = String(CONVERSION_LABEL).trim();
        window.gtag('event', EVENT_NAME, {
            send_to: `${conversionId}/${conversionLabel}`,
            gclid: getCookie('gclid'),
            transaction_id: LEAD.uuid,
            value: PRODUCT.price,
            currency: "BRL",
            items: [{
                id: PRODUCT.id,
                name: PRODUCT.name,
                quantity: PRODUCT.num_items
            }],
            'ecommerce': {
                'purchase': {
                    'actionField': {
                        'id': PRODUCT.id,
                        'affiliation': 'Moriz',
                        'revenue': PRODUCT.price,
                        'name': LEAD.name,
                        'email': LEAD.email, // Inclua o e-mail do comprador
                        'phone': LEAD.phone, // Inclua o telefone do comprador
                        'zipCode': LEAD.zip_code, // Inclua o telefone do comprador
                        'uf': LEAD.uf,
                        'street': LEAD.street,
                        'country': 'Brazil',
                        'city': LEAD.city
                    },
                    'products': [
                        {
                            'id': PRODUCT.uuid,
                            'name': PRODUCT.name,
                            'price': PRODUCT.price,
                            'category': 'Serviço',
                        }
                        // Adicione mais produtos, se houver
                    ]
                }
            }
        });
    }
};

