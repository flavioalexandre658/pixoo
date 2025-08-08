import { z } from 'zod';

const autoCleanupCreditsGetSchema = z.object({
    action: z.enum(["status", "stats"]).optional(),
});

const autoCleanupCreditsPostSchema = z.object({
    action: z.enum(["start", "stop", "force"]),
});

export { autoCleanupCreditsGetSchema, autoCleanupCreditsPostSchema };