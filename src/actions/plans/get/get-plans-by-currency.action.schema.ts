import { z } from 'zod';

export const getPlansByCurrencySchema = z.object({
  currency: z.enum(['USD', 'BRL']).default('USD'),
});

export type GetPlansByCurrencyInput = z.infer<typeof getPlansByCurrencySchema>;