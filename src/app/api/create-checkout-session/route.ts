import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { plans } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planCode, currency, interval = 'monthly' } = body;

    if (!planCode || !currency) {
      return NextResponse.json(
        { error: 'planCode e currency são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar moeda
    if (!['USD', 'BRL'].includes(currency)) {
      return NextResponse.json(
        { error: 'Moeda não suportada. Use USD ou BRL' },
        { status: 400 }
      );
    }

    // Buscar o plano no banco de dados
    const plan = await db.query.plans.findFirst({
      where: and(
        eq(plans.code, planCode),
        eq(plans.currency, currency),
        eq(plans.interval, interval),
        eq(plans.isActive, true)
      ),
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    // Plano gratuito não precisa de checkout
    if (plan.priceInCents === 0) {
      return NextResponse.json(
        { error: 'Plano gratuito não requer checkout' },
        { status: 400 }
      );
    }

    // Gerar ID do preço do Stripe baseado na estrutura: code_interval_currency
    const stripePriceId = `${planCode}_${interval}_${currency.toLowerCase()}`;

    console.log(`🛒 Criando sessão de checkout:`, {
      userId: session.user.id,
      planId: plan.id,
      planCode,
      currency,
      interval,
      stripePriceId,
      priceInCents: plan.priceInCents,
    });

    // Criar sessão de checkout do Stripe
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId, // ID do preço criado no Stripe Dashboard
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      customer_email: session.user.email || undefined,
      metadata: {
        userId: session.user.id,
        planId: plan.id,
        planCode,
        currency,
        interval,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          planId: plan.id,
          planCode,
          currency,
          interval,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      locale: currency === 'BRL' ? 'pt-BR' : 'en',
    });

    console.log(`✅ Sessão de checkout criada: ${checkoutSession.id}`);

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('❌ Erro ao criar sessão de checkout:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Erro do Stripe: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}