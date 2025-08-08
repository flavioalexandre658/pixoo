import { z } from 'zod';

const cleanupCreditsPostSchema = z.object({
    force: z.boolean().optional().default(false),
});

const cleanupCreditsGetSchema = z.object({
    action: z.enum(["stats", "should-cleanup"]),
});

export { cleanupCreditsPostSchema, cleanupCreditsGetSchema };