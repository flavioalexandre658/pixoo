import { z } from 'zod';

const proxyImageSchema = z.object({
    url: z.string().url("URL válida é obrigatória"),
});

export { proxyImageSchema };