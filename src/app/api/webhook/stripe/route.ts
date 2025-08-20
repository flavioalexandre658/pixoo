import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { db } from "../../../../db";
import {
  subscriptions,
  plans,
  creditPackagePurchases,
  userCredits,
  creditTransactions,
} from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { trackConversionMetaServer } from "@/utils/tracking/server-integrations";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export async function POST(req: NextRequest) {
  try {
    // Obter o corpo da requisição como texto
    const body = await req.text();

    // Obter os headers de forma correta
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error(
        "❌ [Stripe Webhook] Assinatura não encontrada nos headers"
      );
      return new NextResponse("Webhook Error: Missing signature", {
        status: 400,
      });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error(
        "❌ [Stripe Webhook] STRIPE_WEBHOOK_SECRET não configurado"
      );
      return new NextResponse("Webhook Error: Missing webhook secret", {
        status: 500,
      });
    }

    console.log("🔍 [Stripe Webhook] Verificando assinatura...");

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error: any) {
      console.error(
        "❌ [Stripe Webhook] Erro na verificação da assinatura:",
        error.message
      );
      return new NextResponse(`Webhook Error: ${error.message}`, {
        status: 400,
      });
    }

    console.log(`✅ [Stripe Webhook] Evento recebido: ${event.type}`);

    // Processar checkout.session.completed - Nova assinatura OU pagamento de pacote
    if (event.type === "checkout.session.completed") {
      console.log(
        "🛒 [Stripe Webhook] Processando checkout.session.completed..."
      );

      const session = event.data.object as Stripe.Checkout.Session;

      // Processar assinaturas
      if (session.mode === "subscription" && session.subscription) {
        console.log("📋 [Stripe Webhook] Processando assinatura...");

        // Buscar a subscription completa para obter metadata e dados
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
          {
            expand: ["latest_invoice", "items.data.price"],
          }
        );

        console.log(`🔍 [Stripe Webhook] Subscription completa:`, {
          id: subscription.id,
          status: subscription.status,
          current_period_start: (subscription as any).current_period_start,
          current_period_end: (subscription as any).current_period_end,
          customer: subscription.customer,
        });

        // Buscar metadata na invoice se não estiver na subscription
        let userId: string | undefined;
        let planId: string | undefined;

        if (subscription.metadata?.userId && subscription.metadata?.planId) {
          userId = subscription.metadata.userId;
          planId = subscription.metadata.planId;
        } else if (session.invoice) {
          // Buscar metadata na invoice
          const invoice = await stripe.invoices.retrieve(
            session.invoice as string
          );
          const lineItem = invoice.lines?.data?.[0];
          if (lineItem?.metadata?.userId && lineItem?.metadata?.planId) {
            userId = lineItem.metadata.userId;
            planId = lineItem.metadata.planId;
          }
        }

        if (!userId || !planId) {
          console.error("❌ [Stripe Webhook] Metadata ausente:", {
            userId,
            planId,
            subscriptionMetadata: subscription.metadata,
            sessionInvoice: session.invoice,
          });
          return new NextResponse("Webhook Error: Missing metadata", {
            status: 400,
          });
        }

        console.log(
          `💳 [Stripe Webhook] Criando assinatura para usuário ${userId} com plano ${planId}`
        );

        const currentPeriodEnd = (subscription as any).current_period_end;
        const currentPeriodStart = (subscription as any).current_period_start;
        const canceledAt = (subscription as any).canceled_at;
        const trialStart = (subscription as any).trial_start;
        const trialEnd = (subscription as any).trial_end;

        console.log(`🔍 [Stripe Webhook] Timestamps recebidos:`, {
          currentPeriodEnd,
          currentPeriodStart,
          canceledAt,
          trialStart,
          trialEnd,
        });

        const renewsAt =
          currentPeriodEnd && !isNaN(currentPeriodEnd)
            ? new Date(currentPeriodEnd * 1000)
            : new Date();

        const values = {
          id: subscription.id,
          userId: userId,
          planId: planId,
          status: subscription.status,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          currentPeriodStart:
            currentPeriodStart && !isNaN(currentPeriodStart)
              ? new Date(currentPeriodStart * 1000)
              : new Date(),
          currentPeriodEnd: renewsAt,
          cancelAtPeriodEnd:
            (subscription as any).cancel_at_period_end || false,
          canceledAt:
            canceledAt && !isNaN(canceledAt)
              ? new Date(canceledAt * 1000)
              : null,
          trialStart:
            trialStart && !isNaN(trialStart)
              ? new Date(trialStart * 1000)
              : null,
          trialEnd:
            trialEnd && !isNaN(trialEnd) ? new Date(trialEnd * 1000) : null,
        };

        // Verificar se já existe uma assinatura para este usuário
        const existingSubscription = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.userId, userId),
        });

        if (existingSubscription) {
          // Atualizar assinatura existente
          await db
            .update(subscriptions)
            .set({
              planId: values.planId,
              status: values.status,
              stripeSubscriptionId: values.stripeSubscriptionId,
              stripeCustomerId: values.stripeCustomerId,
              currentPeriodStart: values.currentPeriodStart,
              currentPeriodEnd: values.currentPeriodEnd,
              cancelAtPeriodEnd: values.cancelAtPeriodEnd,
              canceledAt: values.canceledAt,
              trialStart: values.trialStart,
              trialEnd: values.trialEnd,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.userId, userId));
        } else {
          // Criar nova assinatura
          await db.insert(subscriptions).values(values);
        }

        // Buscar o plano para obter os créditos
        const plan = await db.query.plans.findFirst({
          where: eq(plans.id, planId),
        });

        if (plan && plan.credits > 0) {
          // Obter ou criar créditos do usuário
          let userCredit = await db.query.userCredits.findFirst({
            where: eq(userCredits.userId, userId),
          });

          if (!userCredit) {
            userCredit = await db
              .insert(userCredits)
              .values({
                id: crypto.randomUUID(),
                userId,
                balance: 0,
                totalEarned: 0,
                totalSpent: 0,
              })
              .returning()
              .then((res) => res[0]);
          }

          const newBalance = (userCredit?.balance ?? 0) + plan.credits;
          const newTotalEarned = (userCredit?.totalEarned ?? 0) + plan.credits;

          await db
            .update(userCredits)
            .set({
              balance: newBalance,
              totalEarned: newTotalEarned,
              updatedAt: new Date(),
            })
            .where(eq(userCredits.userId, userId));

          // Registrar transação
          await db.insert(creditTransactions).values({
            id: crypto.randomUUID(),
            userId,
            type: "earned",
            amount: plan.credits,
            description: `Créditos da assinatura do plano ${plan.name}`,
            balanceAfter: newBalance,
            createdAt: new Date(),
          });

          console.log(
            `💰 [Stripe Webhook] ${plan.credits} créditos adicionados para usuário ${userId}`
          );
        }

        // Tracking de conversão
        try {
          const userData = {
            uuid: userId,
            email: session.customer_details?.email,
            name: session.customer_details?.name,
            phone: session.customer_details?.phone,
          };

          const productData = {
            id: planId,
            name: plan?.name || "Subscription",
            price: (session.amount_total || 0) / 100, // Converter de centavos
          };

          // Meta Pixel
          if (
            process.env.NEXT_PUBLIC_META_PIXEL_ID &&
            process.env.META_ACCESS_TOKEN
          ) {
            await trackConversionMetaServer(
              process.env.META_ACCESS_TOKEN,
              process.env.NEXT_PUBLIC_META_PIXEL_ID,
              userData,
              productData,
              "Purchase"
            );
          }

          console.log("✅ Tracking de conversão executado com sucesso");
        } catch (error) {
          console.error("❌ Erro no tracking de conversão:", error);
          // Não falhar o webhook por causa do tracking
        }

        console.log(
          `✅ [Stripe Webhook] Assinatura criada/atualizada com sucesso`
        );
      }
      // Processar pagamentos únicos (pacotes de créditos)
      else if (session.mode === "payment" && session.payment_intent) {
        console.log(
          "💳 [Stripe Webhook] Processando pagamento de pacote de créditos..."
        );

        // Buscar a compra de pacote pelo session ID
        const purchase = await db.query.creditPackagePurchases.findFirst({
          where: eq(creditPackagePurchases.stripeSessionId, session.id),
          with: {
            package: true,
          },
        });

        if (!purchase) {
          console.error(
            "❌ [Stripe Webhook] Compra de pacote não encontrada:",
            session.id
          );
          return new NextResponse("Webhook Error: Purchase not found", {
            status: 400,
          });
        }

        if (purchase.status === "completed") {
          console.log("ℹ️ [Stripe Webhook] Compra já processada, ignorando");
          return new NextResponse("OK", { status: 200 });
        }

        // Atualizar status da compra
        await db
          .update(creditPackagePurchases)
          .set({
            status: "completed",
            stripePaymentIntentId: session.payment_intent as string,
            processedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(creditPackagePurchases.id, purchase.id));

        // Adicionar créditos ao usuário
        let userCredit = await db.query.userCredits.findFirst({
          where: eq(userCredits.userId, purchase.userId),
        });

        if (!userCredit) {
          userCredit = await db
            .insert(userCredits)
            .values({
              id: crypto.randomUUID(),
              userId: purchase.userId,
              balance: 0,
              totalEarned: 0,
              totalSpent: 0,
            })
            .returning()
            .then((res) => res[0]);
        }

        const newBalance = (userCredit?.balance ?? 0) + purchase.credits;
        const newTotalEarned =
          (userCredit?.totalEarned ?? 0) + purchase.credits;

        await db
          .update(userCredits)
          .set({
            balance: newBalance,
            totalEarned: newTotalEarned,
            updatedAt: new Date(),
          })
          .where(eq(userCredits.userId, purchase.userId));

        // Registrar transação
        await db.insert(creditTransactions).values({
          id: crypto.randomUUID(),
          userId: purchase.userId,
          type: "earned",
          amount: purchase.credits,
          description: `Compra de pacote de créditos - ${
            purchase.package?.name || "Pacote"
          }`,
          balanceAfter: newBalance,
          metadata: JSON.stringify({
            packageId: purchase.packageId,
            packageName: purchase.package?.name,
            packageCode: purchase.package?.code,
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent,
            purchaseId: purchase.id,
          }),
          createdAt: new Date(),
        });

        console.log(
          `💰 [Stripe Webhook] ${purchase.credits} créditos adicionados para usuário ${purchase.userId} via pacote`
        );

        // Tracking de conversão para pacotes
        try {
          const userData = {
            uuid: purchase.userId,
            email: session.customer_details?.email,
            name: session.customer_details?.name,
            phone: session.customer_details?.phone,
          };

          const productData = {
            id: purchase.packageId,
            name: purchase.package?.code || "Credit Package",
            price: (session.amount_total || 0) / 100,
          };

          // Meta Pixel
          if (
            process.env.NEXT_PUBLIC_META_PIXEL_ID &&
            process.env.META_ACCESS_TOKEN
          ) {
            await trackConversionMetaServer(
              process.env.META_ACCESS_TOKEN,
              process.env.NEXT_PUBLIC_META_PIXEL_ID,
              userData,
              productData,
              "Purchase"
            );
          }

          console.log(
            "✅ Tracking de conversão executado com sucesso para pacote"
          );
        } catch (error) {
          console.error("❌ Erro no tracking de conversão:", error);
        }

        console.log(
          "✅ [Stripe Webhook] Pacote de créditos processado com sucesso"
        );
      } else {
        console.log(
          "ℹ️ [Stripe Webhook] Tipo de sessão não reconhecido, ignorando",
          {
            mode: session.mode,
            hasSubscription: !!session.subscription,
            hasPaymentIntent: !!session.payment_intent,
          }
        );
      }
    }

    // Processar invoice.payment_succeeded - Renovação de assinatura
    if (event.type === "invoice.payment_succeeded") {
      console.log(
        "💰 [Stripe Webhook] Processando invoice.payment_succeeded..."
      );

      const invoice = event.data.object as Stripe.Invoice;

      if (
        (invoice as any).subscription &&
        typeof (invoice as any).subscription === "string"
      ) {
        const subscription = await stripe.subscriptions.retrieve(
          (invoice as any).subscription
        );

        // Buscar assinatura no banco de dados
        const dbSubscription = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, subscription.id),
          with: {
            plan: true,
          },
        });

        if (!dbSubscription) {
          console.error(
            "❌ [Stripe Webhook] Assinatura não encontrada no banco:",
            subscription.id
          );
          return new NextResponse("Webhook Error: Subscription not found", {
            status: 400,
          });
        }

        const currentPeriodEnd = (subscription as any).current_period_end;
        const currentPeriodStart = (subscription as any).current_period_start;

        const renewsAt =
          currentPeriodEnd && !isNaN(currentPeriodEnd)
            ? new Date(currentPeriodEnd * 1000)
            : new Date();

        // Atualizar dados da assinatura
        await db
          .update(subscriptions)
          .set({
            status: subscription.status,
            currentPeriodStart:
              currentPeriodStart && !isNaN(currentPeriodStart)
                ? new Date(currentPeriodStart * 1000)
                : new Date(),
            currentPeriodEnd: renewsAt,
            cancelAtPeriodEnd:
              (subscription as any).cancel_at_period_end || false,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

        // Se não é a primeira cobrança (renovação), adicionar créditos
        if (invoice.billing_reason === "subscription_cycle") {
          const plan = dbSubscription.plan;
          if (plan && plan.credits > 0) {
            // Obter créditos do usuário
            let userCredit = await db.query.userCredits.findFirst({
              where: eq(userCredits.userId, dbSubscription.userId),
            });

            if (!userCredit) {
              userCredit = await db
                .insert(userCredits)
                .values({
                  id: crypto.randomUUID(),
                  userId: dbSubscription.userId,
                  balance: 0,
                  totalEarned: 0,
                  totalSpent: 0,
                })
                .returning()
                .then((res) => res[0]);
            }

            const newBalance = (userCredit?.balance ?? 0) + plan.credits;
            const newTotalEarned =
              (userCredit?.totalEarned ?? 0) + plan.credits;

            await db
              .update(userCredits)
              .set({
                balance: newBalance,
                totalEarned: newTotalEarned,
                updatedAt: new Date(),
              })
              .where(eq(userCredits.userId, dbSubscription.userId));

            // Registrar transação
            await db.insert(creditTransactions).values({
              id: crypto.randomUUID(),
              userId: dbSubscription.userId,
              type: "earned",
              amount: plan.credits,
              description: `Créditos da renovação do plano ${plan.name}`,
              balanceAfter: newBalance,
              createdAt: new Date(),
            });

            console.log(
              `💰 [Stripe Webhook] ${plan.credits} créditos de renovação adicionados para usuário ${dbSubscription.userId}`
            );
          }
        }

        console.log(`✅ [Stripe Webhook] Pagamento processado com sucesso`);
      }
    }

    // Processar customer.subscription.updated - Mudanças na assinatura
    if (event.type === "customer.subscription.updated") {
      console.log(
        "🔄 [Stripe Webhook] Processando customer.subscription.updated..."
      );

      const subscription = event.data.object as Stripe.Subscription;

      // Buscar assinatura no banco de dados
      const dbSubscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.stripeSubscriptionId, subscription.id),
      });

      if (!dbSubscription) {
        console.log(
          "ℹ️ [Stripe Webhook] Assinatura não encontrada no banco, ignorando"
        );
        return new NextResponse("OK", { status: 200 });
      }

      const currentPeriodEnd = (subscription as any).current_period_end;
      const currentPeriodStart = (subscription as any).current_period_start;
      const canceledAt = (subscription as any).canceled_at;

      const renewsAt =
        currentPeriodEnd && !isNaN(currentPeriodEnd)
          ? new Date(currentPeriodEnd * 1000)
          : new Date();

      // Atualizar status da assinatura
      await db
        .update(subscriptions)
        .set({
          status: subscription.status,
          currentPeriodStart:
            currentPeriodStart && !isNaN(currentPeriodStart)
              ? new Date(currentPeriodStart * 1000)
              : new Date(),
          currentPeriodEnd: renewsAt,
          cancelAtPeriodEnd:
            (subscription as any).cancel_at_period_end || false,
          canceledAt:
            canceledAt && !isNaN(canceledAt)
              ? new Date(canceledAt * 1000)
              : null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

      console.log(
        `✅ [Stripe Webhook] Assinatura atualizada: ${subscription.status}`
      );
    }

    // Processar customer.subscription.deleted - Assinatura cancelada
    if (event.type === "customer.subscription.deleted") {
      console.log(
        "❌ [Stripe Webhook] Processando customer.subscription.deleted..."
      );

      const subscription = event.data.object as Stripe.Subscription;

      // Buscar assinatura no banco de dados
      const dbSubscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.stripeSubscriptionId, subscription.id),
        with: {
          plan: true,
        },
      });

      if (!dbSubscription) {
        console.log(
          "ℹ️ [Stripe Webhook] Assinatura não encontrada no banco, ignorando"
        );
        return new NextResponse("OK", { status: 200 });
      }

      // Atualizar status da assinatura
      await db
        .update(subscriptions)
        .set({
          status: "canceled",
          canceledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

      console.log(`✅ [Stripe Webhook] Assinatura cancelada no banco de dados`);
    }

    // Processar invoice.payment_failed - Falha no pagamento
    if (event.type === "invoice.payment_failed") {
      console.log("💸 [Stripe Webhook] Processando invoice.payment_failed...");

      const invoice = event.data.object as Stripe.Invoice;

      if ((invoice as any).subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          (invoice as any).subscription as string
        );

        // Atualizar status da assinatura
        await db
          .update(subscriptions)
          .set({
            status: subscription.status, // Pode ser 'past_due' ou outro status
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

        console.log(
          `⚠️ [Stripe Webhook] Falha no pagamento, status atualizado: ${subscription.status}`
        );
      }
    }

    // Processar charge.dispute.created - Chargeback/Disputa criada
    if (event.type === "charge.dispute.created") {
      console.log("⚖️ [Stripe Webhook] Processando charge.dispute.created...");
      // TODO: Implementar lógica de remoção de créditos em caso de disputa
      console.log(
        "⚠️ [Stripe Webhook] Lógica de disputa será implementada posteriormente"
      );
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error: any) {
    console.error("❌ [Stripe Webhook] Erro interno:", error);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 500 });
  }
}
