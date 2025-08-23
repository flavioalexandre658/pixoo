import { z } from "zod";

export const checkFingerprintSchema = z.object({
  fingerprint: z.string().min(1, "Fingerprint é obrigatório"),
  ipAddress: z.string().min(1, "IP é obrigatório"),
  userAgent: z.string().min(1, "User agent é obrigatório"),
  screenResolution: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  platform: z.string().optional(),
});

export type CheckFingerprintInput = z.infer<typeof checkFingerprintSchema>;