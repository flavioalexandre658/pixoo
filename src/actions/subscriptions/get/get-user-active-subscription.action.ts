'use server';

import { actionClient } from '@/lib/safe-action';
import { subscriptionOperations } from '@/lib/db';
import { getUserActiveSubscriptionSchema } from './get-user-active-subscription.action.schema';

export const getUserActiveSubscription = actionClient
  .inputSchema(getUserActiveSubscriptionSchema)
  .action(async ({ parsedInput }) => {
    const { userId } = parsedInput;

    try {
      const subscription = await subscriptionOperations.findActiveByUserId(userId);
      
      return {
        success: true,
        data: subscription || null,
      };
    } catch (error) {
      console.error('Erro ao buscar assinatura ativa:', error);
      return {
        success: false,
        errors: {
          _form: ['Erro ao carregar assinatura do usuário'],
        },
      };
    }
  });