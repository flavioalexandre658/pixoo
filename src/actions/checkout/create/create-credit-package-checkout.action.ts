"use server";

import { eq, and } from "drizzle-orm";
import Stripe from "stripe";
import { nanoid } from "nanoid";

import { db } from "@/db";
import { creditPackages, creditPackagePurchases } from "@/db/schema";
import { authActionClient } from "@/lib/safe-action";

import { createCreditPackageCheckoutSchema } from "./create-credit-package-checkout.action.schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export const createCreditPackageCheckout = authActionClient
  .inputSchema(createCreditPackageCheckoutSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { userId, userEmail } = ctx as {
        userId: string;
        userEmail: string;
      };
      const { packageCode, currency } = parsedInput;

      console.log(`🛒 Criando checkout de pacote de créditos:`, {
        userId,
        packageCode,
        currency,
      });

      // Buscar o pacote no banco de dados
      const creditPackage = await db
        .select()
        .from(creditPackages)
        .where(
          and(
            eq(creditPackages.code, packageCode),
            eq(creditPackages.currency, currency),
            eq(creditPackages.isActive, "1")
          )
        )
        .limit(1)
        .then((results) => results[0]);

      if (!creditPackage) {
        return {
          success: false,
          errors: {
            _form: ["Pacote de créditos não encontrado"],
          },
        };
      }

      // Gerar lookup_key do preço do Stripe: creditpackage_code_currency
      const lookupKey = `${packageCode}`;

      console.log(`💳 Dados do checkout:`, {
        packageId: creditPackage.id,
        lookupKey,
        priceInCents: creditPackage.priceInCents,
        credits: creditPackage.credits,
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

      // Criar registro de compra pendente
      const purchaseId = nanoid();
      const sessionId = `cs_${nanoid()}`;

      await db.insert(creditPackagePurchases).values({
        id: purchaseId,
        userId,
        packageId: creditPackage.id,
        stripeSessionId: sessionId,
        credits: creditPackage.credits,
        priceInCents: creditPackage.priceInCents,
        currency,
        status: "pending",
      });

      // Criar sessão de checkout do Stripe
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment", // Pagamento único, não assinatura
        payment_method_types: ["card"],
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/create-image?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/create-image`,
        customer_email: userEmail,
        metadata: {
          userId,
          packageId: creditPackage.id,
          purchaseId,
          packageCode,
          currency,
          credits: creditPackage.credits.toString(),
          type: "credit_package",
        },
        allow_promotion_codes: true,
        billing_address_collection: "required",
        locale: currency === "BRL" ? "pt-BR" : "en",
      });

      // Atualizar com o ID real da sessão do Stripe
      await db
        .update(creditPackagePurchases)
        .set({
          stripeSessionId: checkoutSession.id,
          updatedAt: new Date(),
        })
        .where(eq(creditPackagePurchases.id, purchaseId));

      console.log(`✅ Checkout de pacote criado: ${checkoutSession.id}`);

      return {
        success: true,
        data: {
          sessionId: checkoutSession.id,
          url: checkoutSession.url,
        },
      };
    } catch (error) {
      console.error("❌ Erro ao criar checkout de pacote:", error);

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
