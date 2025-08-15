"use server";

import { eq, and } from "drizzle-orm";
import Stripe from "stripe";

import { db } from "@/db";
import { plans } from "@/db/schema";
import { authActionClient } from "@/lib/safe-action";

import { createCheckoutSessionSchema } from "./create-checkout-session.action.schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export const createCheckoutSession = authActionClient
  .inputSchema(createCheckoutSessionSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { userId, userEmail } = ctx as {
        userId: string;
        userEmail: string;
      };
      const { planCode, currency, interval } = parsedInput;

      console.log(`🛒 Criando sessão de checkout:`, {
        userId,
        planCode,
        currency,
        interval,
      });

      // Buscar o plano no banco de dados
      const plan = await db
        .select()
        .from(plans)
        .where(
          and(
            eq(plans.code, planCode),
            eq(plans.currency, currency),
            eq(plans.interval, interval),
            eq(plans.isActive, true)
          )
        )
        .limit(1)
        .then((results) => results[0]);

      if (!plan) {
        return {
          success: false,
          errors: {
            _form: ["Plano não encontrado"],
          },
        };
      }

      // Plano gratuito não precisa de checkout
      if (plan.priceInCents === 0) {
        return {
          success: false,
          errors: {
            _form: ["Plano gratuito não requer checkout"],
          },
        };
      }

      // Gerar lookup_key do preço do Stripe baseado na estrutura: code_interval_currency
      const lookupKey = `${planCode}_${interval}_${currency.toLowerCase()}`;

      console.log(`💳 Dados do checkout:`, {
        planId: plan.id,
        lookupKey,
        priceInCents: plan.priceInCents,
      });

      // Buscar o preço pelo lookup_key
      const prices = await stripe.prices.list({
        lookup_keys: [lookupKey],
        expand: ["data.product"],
      });

      if (!prices.data.length) {
        console.error(
          `❌ Preço não encontrado no Stripe para lookup_key: ${lookupKey}`
        );
        return {
          success: false,
          errors: {
            _form: ["Preço não configurado no Stripe"],
          },
        };
      }

      const price = prices.data[0];
      console.log(`✅ Preço encontrado no Stripe:`, {
        priceId: price.id,
        lookupKey: price.lookup_key,
        unitAmount: price.unit_amount,
      });

      // Criar sessão de checkout do Stripe
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: price.id, // ID do preço obtido pelo lookup_key
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/create-image?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
        customer_email: userEmail, // Email do usuário logado
        metadata: {
          userId,
          planId: plan.id,
          planCode,
          currency,
          interval,
        },
        subscription_data: {
          metadata: {
            userId,
            planId: plan.id,
            planCode,
            currency,
            interval,
          },
        },
        allow_promotion_codes: true,
        billing_address_collection: "required",
        locale: currency === "BRL" ? "pt-BR" : "en",
      });

      console.log(`✅ Sessão de checkout criada: ${checkoutSession.id}`);

      return {
        success: true,
        data: {
          sessionId: checkoutSession.id,
          url: checkoutSession.url,
        },
      };
    } catch (error) {
      console.error("❌ Erro ao criar sessão de checkout:", error);

      if (error instanceof Stripe.errors.StripeError) {
        return {
          success: false,
          errors: {
            _form: [`Erro do Stripe: ${error.message}`],
          },
        };
      }

      return {
        success: false,
        errors: {
          _form: ["Erro interno do servidor"],
        },
      };
    }
  });
