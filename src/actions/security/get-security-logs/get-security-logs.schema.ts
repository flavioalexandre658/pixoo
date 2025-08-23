import { z } from "zod";

export const getSecurityLogsSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  eventType: z.enum(['account_creation', 'rate_limit_exceeded', 'suspicious_activity', 'fingerprint_reuse', 'multiple_accounts_detected']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  ipAddress: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type GetSecurityLogsInput = z.infer<typeof getSecurityLogsSchema>;