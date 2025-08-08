import { z } from 'zod';

const monitoringCreditsGetSchema = z.object({
    type: z.enum(["overview", "metrics", "health", "usage", "top-users", "models", "dashboard"]).optional().default("overview"),
    period: z.enum(["hour", "day", "week", "month"]).optional().default("day"),
    limit: z.number().int().positive().optional().default(10),
});

const monitoringCreditsPostSchema = z.object({
    action: z.enum(["health-check", "generate-report"]),
});

export { monitoringCreditsGetSchema, monitoringCreditsPostSchema };