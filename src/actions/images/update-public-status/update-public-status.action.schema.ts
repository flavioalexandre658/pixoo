import { z } from "zod";

export const updatePublicStatusSchema = z.object({
  imageId: z.string().min(1, "ID da imagem é obrigatório"),
  isPublic: z.boolean(),
});

export type UpdatePublicStatusInput = z.infer<typeof updatePublicStatusSchema>;