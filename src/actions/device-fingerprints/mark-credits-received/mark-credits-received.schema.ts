import { z } from "zod";

export const markCreditsReceivedSchema = z.object({
  fingerprintId: z.string().uuid("ID do fingerprint deve ser um UUID válido"),
  userId: z.string().uuid("ID do usuário deve ser um UUID válido"),
});

export type MarkCreditsReceivedInput = z.infer<typeof markCreditsReceivedSchema>;