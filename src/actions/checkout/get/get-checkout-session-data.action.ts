"use server";

import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { creditPackagePurchases, subscriptions, users } from "@/db/schema";
import { authActionClient } from "@/lib/safe-action";
import { getCheckoutSessionDataSchema } from "./get-checkout-session-data.action.schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY não configurado");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export const getCheckoutSessionData = authActionClient
  .inputSchema(getCheckoutSessionDataSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { sessionId } = parsedInput;
    const { userId } = ctx as { userId: string };

    try {
      // Recuperar dados da sessão do Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items", "subscription", "payment_intent"],
      });

      // Verificar se a sessão pertence ao usuário logado
      if (session.metadata?.userId !== userId) {
        return {
          success: false,
          errors: {
            _form: ["Sessão não encontrada ou não autorizada"],
          },
        };
      }

      // Verificar se o pagamento foi bem-sucedido
      if (session.payment_status !== "paid") {
        return {
          success: false,
          errors: {
            _form: ["Pagamento não foi concluído"],
          },
        };
      }

      // Buscar dados do usuário no banco se necessário (para obter o nome)
      let userName = session.customer_details?.name || "";
      if (!userName) {
        const user = await db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { name: true },
        });
        userName = user?.name || "";
      }

      const conversionData = {
        sessionId: session.id,
        userId: userId,
        userEmail: session.customer_details?.email || "",
        userName: userName,
        amount: (session.amount_total || 0) / 100, // Converter de centavos
        currency: session.currency?.toUpperCase() || "USD",
        paymentStatus: session.payment_status,
        mode: session.mode, // 'subscription' ou 'payment'
        productName: "",
        productId: "",
        transactionId: "",
      };

      // Se for uma assinatura
      if (session.mode === "subscription" && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        // Buscar dados da assinatura no banco
        const dbSubscription = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, subscription.id),
          with: {
            plan: true,
          },
        });

        if (dbSubscription?.plan) {
          conversionData.productName = dbSubscription.plan.name;
          conversionData.productId = dbSubscription.plan.id;
          conversionData.transactionId = subscription.id;
        }
      }
      // Se for um pacote de créditos
      else if (session.mode === "payment" && session.payment_intent) {
        // Buscar dados do pacote no banco
        const purchase = await db.query.creditPackagePurchases.findFirst({
          where: eq(creditPackagePurchases.stripeSessionId, session.id),
          with: {
            package: true,
          },
        });

        if (purchase?.package) {
          conversionData.productName = purchase.package.code;
          conversionData.productId = purchase.package.id;
          conversionData.transactionId = session.payment_intent as string;
        }
      }

      return {
        success: true,
        data: conversionData,
      };
    } catch (error) {
      console.error("Erro ao recuperar dados da sessão:", error);
      return {
        success: false,
        errors: {
          _form: ["Erro ao recuperar dados da sessão"],
        },
      };
    }
  });
