import { z } from 'zod';

const getImagesHistorySchema = z.object({
    limit: z.number().int().positive().optional().default(50),
});

export { getImagesHistorySchema };