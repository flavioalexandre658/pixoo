"use server";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { authActionClient } from "@/lib/safe-action";
import { generatedImages, modelCosts } from "@/db/schema";

import { getImagesHistorySchema } from "./get-images-history.action.schema";

export const getImagesHistory = authActionClient
  .inputSchema(getImagesHistorySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx as { userId: string };
    const { limit, offset } = parsedInput;

    try {
      console.log(`🔄 Buscando histórico de imagens:`, {
        userId,
        limit,
        offset,
        timestamp: new Date().toISOString(),
      });

      // Buscar imagens do usuário com informações do modelo
      const images = await db
        .select({
          id: generatedImages.id,
          prompt: generatedImages.prompt,
          model: generatedImages.model,
          modelName: modelCosts.modelName,
          aspectRatio: generatedImages.aspectRatio,
          imageUrl: generatedImages.imageUrl,
          status: generatedImages.status,
          creditsUsed: generatedImages.creditsUsed,
          generationTimeMs: generatedImages.generationTimeMs,
          createdAt: generatedImages.createdAt,
          userId: generatedImages.userId,
          taskId: generatedImages.taskId,
          reservationId: generatedImages.reservationId,
          seed: generatedImages.seed,
          steps: generatedImages.steps,
          guidance: generatedImages.guidance,
          completedAt: generatedImages.completedAt,
          isPublic: generatedImages.isPublic,
        })
        .from(generatedImages)
        .leftJoin(modelCosts, eq(generatedImages.model, modelCosts.modelId))
        .where(eq(generatedImages.userId, userId))
        .orderBy(desc(generatedImages.createdAt))
        .limit(limit)
        .offset(offset);

      console.log(`✅ Histórico de imagens obtido com sucesso:`, {
        userId,
        imagesCount: images.length,
        limit,
        offset,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        data: images,
        hasMore: images.length === limit, // Se retornou o limite completo, pode haver mais
      };
    } catch (error) {
      console.error(`❌ Erro ao buscar histórico de imagens:`, {
        userId,
        limit,
        offset,
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
