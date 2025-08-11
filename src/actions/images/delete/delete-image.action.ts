"use server";

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { authActionClient } from "@/lib/safe-action";
import { generatedImages, creditTransactions } from "@/db/schema";
import { deleteImageFromS3, extractS3FileNameFromUrl } from "@/lib/s3";
import { deleteImageSchema } from "./delete-image.action.schema";

export const deleteImage = authActionClient
  .inputSchema(deleteImageSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx as { userId: string };
    const { imageId } = parsedInput;

    try {
      console.log(`🔄 Deletando imagem:`, {
        userId,
        imageId,
        timestamp: new Date().toISOString(),
      });

      // Buscar a imagem no banco de dados
      const [image] = await db
        .select()
        .from(generatedImages)
        .where(
          and(
            eq(generatedImages.id, imageId),
            eq(generatedImages.userId, userId)
          )
        )
        .limit(1);

      if (!image) {
        console.error(`❌ Imagem não encontrada:`, {
          imageId,
          userId,
          timestamp: new Date().toISOString(),
        });
        return {
          success: false,
          errors: {
            _form: ["Imagem não encontrada ou você não tem permissão para deletá-la"],
          },
        };
      }

      // Deletar do S3 se a imagem estiver hospedada lá
      if (image.imageUrl) {
        const s3FileName = extractS3FileNameFromUrl(image.imageUrl);
        if (s3FileName) {
          try {
            await deleteImageFromS3(s3FileName);
            console.log(`✅ Imagem deletada do S3:`, {
              imageId,
              s3FileName,
              timestamp: new Date().toISOString(),
            });
          } catch (s3Error) {
            console.error(`⚠️ Erro ao deletar do S3 (continuando com deleção do banco):`, {
              imageId,
              s3FileName,
              error: s3Error,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }

      // Primeiro, deletar transações de crédito relacionadas
      await db
        .delete(creditTransactions)
        .where(eq(creditTransactions.relatedImageId, imageId));

      // Depois, deletar a imagem do banco de dados
      await db
        .delete(generatedImages)
        .where(eq(generatedImages.id, imageId));

      console.log(`✅ Imagem deletada com sucesso:`, {
        userId,
        imageId,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        data: {
          message: "Imagem deletada com sucesso",
          deletedImageId: imageId,
        },
      };
    } catch (error) {
      console.error(`❌ Erro ao deletar imagem:`, {
        userId,
        imageId,
        error,
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