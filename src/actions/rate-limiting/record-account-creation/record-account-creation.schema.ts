import { z } from "zod";

export const recordAccountCreationSchema = z.object({
  ipAddress: z.string().min(1, "IP address é obrigatório"),
  userAgent: z.string().min(1, "User agent é obrigatório"),
  fingerprint: z.string().optional(),
  email: z.string().email("Email inválido"),
  userId: z.string().min(1, "User ID é obrigatório"),
});

export type RecordAccountCreationInput = z.infer<typeof recordAccountCreationSchema>;