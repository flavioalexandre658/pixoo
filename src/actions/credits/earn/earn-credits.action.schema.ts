import { z } from 'zod';

const earnCreditsSchema = z.object({
    amount: z.number().positive("Quantidade deve ser positiva"),
    description: z.string().min(1, "Descrição é obrigatória"),
    type: z.enum(["earned", "bonus", "refund"]).default("earned"),
    relatedImageId: z.string().optional(),
});

export { earnCreditsSchema };
