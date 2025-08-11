import { z } from 'zod';

const generateImageSchema = z.object({
    prompt: z.string().min(1, "Prompt é obrigatório"),
    model: z.string().min(1, "Modelo é obrigatório"),
    aspectRatio: z.string().optional().default("1:1"),
    width: z.number().int().positive().max(1440, "Largura máxima é 1440px").optional(),
    height: z.number().int().positive().max(1440, "Altura máxima é 1440px").optional(),
    seed: z.number().int().optional(),
    steps: z.number().int().positive().optional(),
    guidance: z.number().positive().optional(),
    imagePublic: z.boolean().optional(),
});

export { generateImageSchema };