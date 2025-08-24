"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { getCheckoutSessionData } from "@/actions/checkout/get/get-checkout-session-data.action";

// Declarar tipos globais para os pixels
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}

interface ConversionData {
  sessionId: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  productName: string;
  productId: string;
  transactionId: string;
  mode: string;
}

export function useConversionTracking() {
  const searchParams = useSearchParams();
  const hasTracked = useRef(false);

  const { executeAsync: executeGetSessionData } = useAction(
    getCheckoutSessionData
  );

  const trackGoogleAdsConversion = (data: ConversionData) => {
    console.log("🔍 Tentando rastrear conversão Google Ads...");
    console.log("📊 Dados da conversão:", data);
    console.log("🏷️ Google Ads ID:", process.env.NEXT_PUBLIC_GOOGLE_ADS_ID);
    console.log("🎯 Conversion ID:", process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID);
    console.log("🏷️ Conversion Label:", process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL);
    console.log("🌐 Window.gtag disponível:", typeof window !== "undefined" && !!window.gtag);
    
    if (typeof window !== "undefined" && window.gtag) {
      try {
        // Enhanced Conversions para Google Ads
        window.gtag("event", "conversion", {
          send_to: `${process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID}/${process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL}`,
          value: data.amount,
          currency: data.currency,
          transaction_id: data.transactionId,
          user_data: {
            email_address: data.userEmail,
            phone_number: undefined,
            address: {
              first_name: data.userName?.split(" ")[0],
              last_name: data.userName?.split(" ").slice(1).join(" "),
            },
          },
          custom_parameters: {
            product_id: data.productId,
            product_name: data.productName,
            user_id: data.userId,
            subscription_type: data.mode,
          },
        });

        // Evento adicional para Purchase
        window.gtag("event", "purchase", {
          transaction_id: data.transactionId,
          value: data.amount,
          currency: data.currency,
          items: [
            {
              item_id: data.productId,
              item_name: data.productName,
              category:
                data.mode === "subscription" ? "Subscription" : "Credits",
              quantity: 1,
              price: data.amount,
            },
          ],
        });

        console.log("✅ Google Ads conversion tracked:", data);
      } catch (error) {
        console.error("❌ Erro no tracking Google Ads:", error);
      }
    } else {
      console.warn("⚠️ Google Ads gtag não disponível. Verifique se o pixel está carregado.");
    }
  };

  const trackMetaConversion = (data: ConversionData) => {
    if (typeof window !== "undefined" && window.fbq) {
      try {
        // Evento Purchase para Meta Pixel
        window.fbq(
          "track",
          "Purchase",
          {
            value: data.amount,
            currency: data.currency,
            content_ids: [data.productId],
            content_name: data.productName,
            content_type:
              data.mode === "subscription" ? "subscription" : "product",
            num_items: 1,
          },
          {
            // Enhanced matching para melhor qualidade de conversão
            em: data.userEmail,
            fn: data.userName?.split(" ")[0],
            ln: data.userName?.split(" ").slice(1).join(" "),
            external_id: data.userId,
          }
        );

        // Evento Subscribe adicional para assinaturas
        if (data.mode === "subscription") {
          window.fbq(
            "track",
            "Subscribe",
            {
              value: data.amount,
              currency: data.currency,
              predicted_ltv: data.amount * 12, // Estimativa de LTV anual
            },
            {
              em: data.userEmail,
              fn: data.userName?.split(" ")[0],
              ln: data.userName?.split(" ").slice(1).join(" "),
              external_id: data.userId,
            }
          );
        }

        console.log("✅ Meta Pixel conversion tracked:", data);
      } catch (error) {
        console.error("❌ Erro no tracking Meta Pixel:", error);
      }
    }
  };

  // Função para simular dados de teste
  const createTestConversionData = (sessionId: string): ConversionData => {
    const isSubscription = Math.random() > 0.5; // 50% chance de ser assinatura
    const amount = isSubscription ? 29.99 : 19.99;
    
    return {
      sessionId,
      userId: "test_user_" + Date.now(),
      userEmail: "test@pixoo.com",
      userName: "Test User",
      amount,
      currency: "USD",
      productName: isSubscription ? "Pro Subscription" : "Credit Package 100",
      productId: isSubscription ? "sub_pro" : "pkg_100",
      transactionId: "test_txn_" + Date.now(),
      mode: isSubscription ? "subscription" : "payment",
    };
  };

  const processConversion = async (sessionId: string) => {
    console.log("🚀 Iniciando processamento de conversão para session_id:", sessionId);
    console.log("🔧 Ambiente:", process.env.NODE_ENV);
    
    try {
      // Verificar se é um teste (removendo verificação de ambiente)
      if (sessionId === "teste") {
        console.log("🧪 Modo de teste ativado - simulando conversão");
        
        const testData = createTestConversionData(sessionId);
        console.log("📋 Dados de teste gerados:", testData);
        
        // Rastrear conversões com dados simulados
        trackGoogleAdsConversion(testData);
        trackMetaConversion(testData);
        
        // Limpar o session_id da URL
        const url = new URL(window.location.href);
        url.searchParams.delete("session_id");
        window.history.replaceState({}, "", url.toString());
        
        console.log("✅ Conversão de teste processada com sucesso:", testData);
        return;
      }
      
      // Processo normal para session_ids reais
      const result = await executeGetSessionData({ sessionId });
  
      if (result?.data?.success && result.data.data) {
        const conversionData = result.data.data;
  
        // Rastrear conversões
        trackGoogleAdsConversion(conversionData);
        trackMetaConversion(conversionData);
  
        // Limpar o session_id da URL para evitar re-tracking
        const url = new URL(window.location.href);
        url.searchParams.delete("session_id");
        window.history.replaceState({}, "", url.toString());
  
        console.log("✅ Conversão processada com sucesso:", conversionData);
      } else {
        console.error("❌ Erro ao processar conversão:", result?.data?.errors);
      }
    } catch (error) {
      console.error("❌ Erro ao processar conversão:", error);
    }
  };

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    console.log("🔍 Hook useConversionTracking executado");
    console.log("📋 Session ID encontrado:", sessionId);
    console.log("🔄 Já foi rastreado:", hasTracked.current);

    // Verificar se há session_id e se ainda não foi rastreado
    if (sessionId && !hasTracked.current) {
      console.log("✅ Condições atendidas, iniciando rastreamento...");
      hasTracked.current = true;

      // Aguardar um pouco para garantir que os pixels estejam carregados
      setTimeout(() => {
        processConversion(sessionId);
      }, 1000);
    } else {
      console.log("❌ Condições não atendidas para rastreamento");
    }
  }, [searchParams]);

  return {
    trackGoogleAdsConversion,
    trackMetaConversion,
    createTestConversionData, // Exportar para uso externo se necessário
  };
}
