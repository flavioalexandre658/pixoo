'use server';

import { db } from '@/db';
import { actionClient } from '@/lib/safe-action';
import { plans } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getPlansByCurrencySchema } from './get-plans-by-currency.action.schema';

export const getPlansByCurrency = actionClient
  .inputSchema(getPlansByCurrencySchema)
  .action(async ({ parsedInput }) => {
    try {
      const { currency } = parsedInput;

      console.log(`🔄 Buscando planos para moeda: ${currency}`);

      // Buscar planos ativos para a moeda especificada
      const plansList = await db
        .select()
        .from(plans)
        .where(
          and(
            eq(plans.currency, currency),
            eq(plans.isActive, true)
          )
        )
        .orderBy(plans.priceInCents);

      if (!plansList.length) {
        return {
          success: false,
          errors: {
            _form: [`Nenhum plano encontrado para a moeda ${currency}`],
          },
        };
      }

      // Processar features de JSON string para array
      const processedPlans = plansList.map(plan => ({
        ...plan,
        features: plan.features ? JSON.parse(plan.features) : [],
        priceFormatted: currency === 'BRL' 
          ? `R$ ${(plan.priceInCents / 100).toFixed(2).replace('.', ',')}`
          : `$${(plan.priceInCents / 100).toFixed(2)}`,
        stripePriceId: `${plan.code}_${plan.interval}_${currency.toLowerCase()}`, // Manter compatibilidade
        lookupKey: `${plan.code}_${plan.interval}_${currency.toLowerCase()}` // Lookup key para buscar preços no Stripe
      }));

      console.log(`✅ ${processedPlans.length} planos encontrados para ${currency}`);

      return {
        success: true,
        data: processedPlans,
      };
    } catch (error) {
      console.error('❌ Erro ao buscar planos:', error);
      return {
        success: false,
        errors: {
          _form: [
            error instanceof Error ? error.message : 'Erro interno do servidor',
          ],
        },
      };
    }
  });