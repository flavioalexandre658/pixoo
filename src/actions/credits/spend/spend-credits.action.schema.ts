import { z } from 'zod';

const spendCreditsSchema = z.object({
    modelId: z.string().min(1, "ID do modelo é obrigatório"),
    imageId: z.string().optional(),
    description: z.string().optional(),
});

export { spendCreditsSchema };