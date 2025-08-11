import { z } from "zod";

export const deleteImageSchema = z.object({
  imageId: z.string().min(1, "ID da imagem é obrigatório"),
});

export type DeleteImageInput = z.infer<typeof deleteImageSchema>;