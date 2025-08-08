import { z } from 'zod';

const reserveCreditsSchema = z.object({
    modelId: z.string().min(1, "Model ID é obrigatório"),
    description: z.string().optional(),
});

export { reserveCreditsSchema };