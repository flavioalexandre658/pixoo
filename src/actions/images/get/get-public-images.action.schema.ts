import { z } from "zod";

export const getPublicImagesSchema = z.object({
  limit: z.number().min(1).max(50).optional().default(20),
  offset: z.number().min(0).optional().default(0),
  category: z.string().optional(),
});

export type GetPublicImagesInput = z.infer<typeof getPublicImagesSchema>;