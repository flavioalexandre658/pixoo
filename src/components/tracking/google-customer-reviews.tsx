import Script from 'next/script';
const GoogleCustomerReviews = ({
  merchantId,
  orderId,
  email,
  deliveryCountry,
  estimatedDeliveryDate,
  products = [],
}: {
  merchantId: string;
  orderId: string;
  email: string;
  deliveryCountry: string;
  estimatedDeliveryDate: string;
  products: any[];
}) => {
  if (!merchantId) return null;

  return (
    <>
      {/* Script principal (carregado de forma assíncrona) */}
      <Script
        id="google-customer-reviews-script"
        strategy="afterInteractive"
        src="https://apis.google.com/js/platform.js?onload=renderOptIn"
        async
        defer
      />

      {/* Configuração do opt-in */}
      <Script id="google-customer-reviews-config" strategy="afterInteractive">
        {`
          window.renderOptIn = function() {
            window.gapi.load('surveyoptin', function() {
              window.gapi.surveyoptin.render(
                {
                  merchant_id: ${merchantId},
                  order_id: "${orderId}",
                  email: "${email}",
                  delivery_country: "${deliveryCountry}",
                  estimated_delivery_date: "${estimatedDeliveryDate}",
                  products: ${JSON.stringify(products)}
                }
              );
            });
          }
        `}
      </Script>
    </>
  );
};

export default GoogleCustomerReviews;