import { z } from "zod";

export const getCheckoutSessionDataSchema = z.object({
  sessionId: z.string().min(1, "Session ID é obrigatório"),
});

export type GetCheckoutSessionDataInput = z.infer<typeof getCheckoutSessionDataSchema>;