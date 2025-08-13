"use server";

import { db } from "@/db";
import { generatedImages } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { authActionClient } from "@/lib/safe-action";
import { z } from "zod";

const likeImageSchema = z.object({
  imageId: z.string().min(1, "ID da imagem é obrigatório"),
  isLiked: z.boolean(),
});

export const likeImage = authActionClient
  .inputSchema(likeImageSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx as { userId: string };
    const { imageId, isLiked } = parsedInput;

    try {
      console.log('🔄 Processando like/unlike:', {
        userId,
        imageId,
        isLiked,
        timestamp: new Date().toISOString()
      });

      // Verificar se a imagem existe e é pública
      const image = await db
        .select({
          id: generatedImages.id,
          likes: generatedImages.likes,
          isPublic: generatedImages.isPublic,
        })
        .from(generatedImages)
        .where(eq(generatedImages.id, imageId))
        .limit(1);

      if (!image.length) {
        return {
          success: false,
          errors: {
            _form: ["Imagem não encontrada"]
          }
        };
      }

      if (!image[0].isPublic) {
        return {
          success: false,
          errors: {
            _form: ["Não é possível curtir imagens privadas"]
          }
        };
      }

      // Atualizar likes: incrementar se isLiked=true, decrementar se isLiked=false
      const updatedImage = await db
        .update(generatedImages)
        .set({
          likes: isLiked 
            ? sql`${generatedImages.likes} + 1`
            : sql`GREATEST(${generatedImages.likes} - 1, 0)` // Não permitir likes negativos
        })
        .where(eq(generatedImages.id, imageId))
        .returning({
          id: generatedImages.id,
          likes: generatedImages.likes
        });

      if (!updatedImage.length) {
        return {
          success: false,
          errors: {
            _form: ["Erro ao atualizar likes"]
          }
        };
      }

      console.log('✅ Like/unlike processado com sucesso:', {
        userId,
        imageId,
        isLiked,
        newLikesCount: updatedImage[0].likes,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        data: {
          imageId: updatedImage[0].id,
          likes: updatedImage[0].likes,
          isLiked
        }
      };
    } catch (error) {
      console.error('❌ Erro ao processar like/unlike:', {
        userId,
        imageId,
        isLiked,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        errors: {
          _form: [error instanceof Error ? error.message : "Erro interno do servidor"]
        }
      };
    }
  });