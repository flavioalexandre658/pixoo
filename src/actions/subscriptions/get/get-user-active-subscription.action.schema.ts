import { z } from 'zod';

export const getUserActiveSubscriptionSchema = z.object({
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
});

export type GetUserActiveSubscriptionInput = z.infer<typeof getUserActiveSubscriptionSchema>;