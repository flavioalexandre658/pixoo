"use server";

import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { authActionClient } from "@/lib/safe-action";
import { generatedImages, creditTransactions } from "@/db/schema";
import { deleteMultipleImagesFromS3, extractS3FileNameFromUrl } from "@/lib/s3";
import { deleteMultipleImagesSchema } from "./delete-multiple-images.action.schema";

export const deleteMultipleImages = authActionClient
  .inputSchema(deleteMultipleImagesSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx as { userId: string };
    const { imageIds } = parsedInput;

    try {
      console.log(`🔄 Deletando múltiplas imagens:`, {
        userId,
        imageCount: imageIds.length,
        imageIds,
        timestamp: new Date().toISOString(),
      });

      // Buscar as imagens no banco de dados
      const images = await db
        .select()
        .from(generatedImages)
        .where(
          and(
            inArray(generatedImages.id, imageIds),
            eq(generatedImages.userId, userId)
          )
        );

      if (images.length === 0) {
        console.error(`❌ Nenhuma imagem encontrada:`, {
          imageIds,
          userId,
          timestamp: new Date().toISOString(),
        });
        return {
          success: false,
          errors: {
            _form: ["Nenhuma imagem encontrada ou você não tem permissão para deletá-las"],
          },
        };
      }

      // Extrair nomes dos arquivos S3
      const s3FileNames: string[] = [];
      const imageUrlMap = new Map<string, string>();
      
      for (const image of images) {
        if (image.imageUrl) {
          const s3FileName = extractS3FileNameFromUrl(image.imageUrl);
          if (s3FileName) {
            s3FileNames.push(s3FileName);
            imageUrlMap.set(image.id, s3FileName);
          }
        }
      }

      // Deletar do S3 se houver arquivos
      let s3DeletionResult: { deleted: string[], errors: string[] } = { deleted: [], errors: [] };
      if (s3FileNames.length > 0) {
        try {
          s3DeletionResult = await deleteMultipleImagesFromS3(s3FileNames);
          console.log(`✅ Resultado da deleção no S3:`, {
            deleted: s3DeletionResult.deleted.length,
            errors: s3DeletionResult.errors.length,
            timestamp: new Date().toISOString(),
          });
        } catch (s3Error) {
          console.error(`⚠️ Erro ao deletar do S3 (continuando com deleção do banco):`, {
            imageIds,
            s3FileNames,
            error: s3Error,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Primeiro, deletar transações de crédito relacionadas
      const foundImageIds = images.map(img => img.id);
      await db
        .delete(creditTransactions)
        .where(inArray(creditTransactions.relatedImageId, foundImageIds));

      // Depois, deletar as imagens do banco de dados
      await db
        .delete(generatedImages)
        .where(inArray(generatedImages.id, foundImageIds));

      console.log(`✅ Múltiplas imagens deletadas com sucesso:`, {
        userId,
        deletedCount: foundImageIds.length,
        requestedCount: imageIds.length,
        s3Deleted: s3DeletionResult.deleted.length,
        s3Errors: s3DeletionResult.errors.length,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        data: {
          message: `${foundImageIds.length} imagem(ns) deletada(s) com sucesso`,
          deletedImageIds: foundImageIds,
          requestedCount: imageIds.length,
          deletedCount: foundImageIds.length,
          s3DeletionResult,
        },
      };
    } catch (error) {
      console.error(`❌ Erro ao deletar múltiplas imagens:`, {
        userId,
        imageIds,
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