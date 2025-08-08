import { z } from "zod";

export const upsertImageSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"), // Se for gerado no back, pode usar z.string().optional()
  taskId: z.string().min(1, "Task ID é obrigatório"),
  prompt: z.string().min(1, "Prompt é obrigatório"),
  model: z.string().min(1, "Modelo é obrigatório"),
  aspectRatio: z.string().optional().default("1:1"),
  imageUrl: z.string().optional().nullable(),
  status: z.enum(["pending", "ready", "error"]).default("pending"),
  creditsUsed: z.number().int().nonnegative().default(0).optional(),
  reservationId: z.string().optional().nullable(),
  generationTimeMs: z.number().int().optional().nullable(),
  seed: z.number().int().optional().nullable(),
  steps: z.number().int().optional().nullable(),
  guidance: z.number().multipleOf(0.1).optional().nullable().transform(val => val !== null && val !== undefined ? val.toString() : val), // Ex: 7.5, 8.0...
  isPublic: z.boolean().optional().default(false),
  createdAt: z.date().optional(), // Ou z.string().datetime() se vier em string
  completedAt: z.date().optional().nullable(),
});

export type UpsertImageSchema = z.infer<typeof upsertImageSchema>;
