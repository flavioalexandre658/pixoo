"use server";

import { authActionClient } from "@/lib/safe-action";
import { updatePublicStatusSchema } from "./update-public-status.action.schema";
import { db } from "@/db";
import { generatedImages } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const updateImagePublicStatus = authActionClient
  .schema(updatePublicStatusSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx as { userId: string };
    const { imageId, isPublic } = parsedInput;

    try {
      console.log(`🔄 Atualizando status público da imagem:`, {
        userId,
        imageId,
        isPublic,
        timestamp: new Date().toISOString(),
      });

      // Verificar se a imagem existe e pertence ao usuário
      const [existingImage] = await db
        .select({
          id: generatedImages.id,
          userId: generatedImages.userId,
          isPublic: generatedImages.isPublic,
        })
        .from(generatedImages)
        .where(
          and(
            eq(generatedImages.id, imageId),
            eq(generatedImages.userId, userId)
          )
        )
        .limit(1);

      if (!existingImage) {
        console.error(`❌ Imagem não encontrada ou não pertence ao usuário:`, {
          imageId,
          userId,
          timestamp: new Date().toISOString(),
        });
        return {
          success: false,
          errors: {
            _form: ["Imagem não encontrada ou você não tem permissão para editá-la"],
          },
        };
      }

      // Atualizar o status público da imagem
      await db
        .update(generatedImages)
        .set({ 
          isPublic,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(generatedImages.id, imageId),
            eq(generatedImages.userId, userId)
          )
        );

      console.log(`✅ Status público da imagem atualizado com sucesso:`, {
        imageId,
        userId,
        isPublic,
        previousStatus: existingImage.isPublic,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        data: {
          imageId,
          isPublic,
          message: isPublic 
            ? "Imagem tornada pública com sucesso" 
            : "Imagem tornada privada com sucesso",
        },
      };
    } catch (error) {
      console.error(`❌ Erro ao atualizar status público da imagem:`, {
        imageId,
        userId,
        isPublic,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
      return {
        success: false,
        errors: {
          _form: [
            error instanceof Error ? error.message : "Erro interno do servidor",
          ],
        },
      };
    }
  });