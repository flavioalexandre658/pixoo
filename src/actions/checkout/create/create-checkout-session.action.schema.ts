import { z } from 'zod';

export const createCheckoutSessionSchema = z.object({
  planCode: z.string().min(1, 'Código do plano é obrigatório'),
  currency: z.enum(['USD', 'BRL'], {
    message: 'Moeda deve ser USD ou BRL'
  }),
  interval: z.enum(['monthly', 'yearly']).default('monthly'),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;