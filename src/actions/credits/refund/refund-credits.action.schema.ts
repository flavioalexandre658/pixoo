import { z } from 'zod';

const refundCreditsSchema = z.object({
    amount: z.number().positive("Quantidade deve ser positiva"),
    description: z.string().min(1, "Descrição é obrigatória"),
    relatedImageId: z.string().optional(),
    originalTransactionId: z.string().optional(),
});

export { refundCreditsSchema };