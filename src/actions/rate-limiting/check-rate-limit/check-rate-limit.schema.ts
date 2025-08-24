import { z } from "zod";

export const checkRateLimitSchema = z.object({
  ipAddress: z.string().min(1, "IP address é obrigatório"),
  userAgent: z.string().min(1, "User agent é obrigatório"),
  fingerprint: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
});

export type CheckRateLimitInput = z.infer<typeof checkRateLimitSchema>;