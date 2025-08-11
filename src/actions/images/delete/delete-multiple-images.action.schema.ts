import { z } from "zod";

export const deleteMultipleImagesSchema = z.object({
  imageIds: z.array(z.string().min(1, "ID da imagem é obrigatório")).min(1, "Pelo menos uma imagem deve ser selecionada"),
});

export type DeleteMultipleImagesInput = z.infer<typeof deleteMultipleImagesSchema>;