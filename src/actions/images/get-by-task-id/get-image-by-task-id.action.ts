"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { authActionClient } from "@/lib/safe-action";
import { generatedImages } from "@/db/schema";

import { getImageByTaskIdSchema } from "./get-image-by-task-id.action.schema";

// Função interna para uso em webhooks (sem autenticação)
export async function getImageByTaskIdInternal(taskId: string) {
  try {
    console.log(`🔄 Buscando imagem por taskId (interno):`, {
      taskId,
      timestamp: new Date().toISOString(),
    });

    // Buscar a imagem no banco de dados
    const [image] = await db
      .select({
        id: generatedImages.id,
        reservationId: generatedImages.reservationId,
        taskId: generatedImages.taskId,
        userId: generatedImages.userId,
        status: generatedImages.status,
        imageUrl: generatedImages.imageUrl,
        prompt: generatedImages.prompt,
        model: generatedImages.model,
        createdAt: generatedImages.createdAt,
        completedAt: generatedImages.completedAt,
      })
      .from(generatedImages)
      .where(eq(generatedImages.taskId, taskId))
      .limit(1);

    if (!image) {
      console.error(`❌ Imagem não encontrada (interno):`, {
        taskId,
        timestamp: new Date().toISOString(),
      });
      return {
        success: false,
        errors: {
          _form: ["Imagem não encontrada"],
        },
      };
    }

    console.log(`✅ Imagem encontrada com sucesso (interno):`, {
      taskId,
      status: image.status,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      data: {
        id: image.id,
        reservationId: image.reservationId,
        taskId: image.taskId,
        userId: image.userId,
        status: image.status,
        imageUrl: image.imageUrl,
        prompt: image.prompt,
        model: image.model,
        createdAt: image.createdAt,
        completedAt: image.completedAt,
      },
    };
  } catch (error) {
    console.error(`❌ Erro ao buscar imagem por taskId (interno):`, {
      taskId,
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
}

export const getImageByTaskId = authActionClient
  .inputSchema(getImageByTaskIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx as { userId: string };
    const { taskId } = parsedInput;

    try {
      console.log(`🔄 Buscando imagem por taskId:`, {
        userId,
        taskId,
        timestamp: new Date().toISOString(),
      });

      // Buscar a imagem no banco de dados
      const [image] = await db
        .select({
          id: generatedImages.id,
          reservationId: generatedImages.reservationId,
          taskId: generatedImages.taskId,
          userId: generatedImages.userId,
          status: generatedImages.status,
          imageUrl: generatedImages.imageUrl,
          prompt: generatedImages.prompt,
          model: generatedImages.model,
          createdAt: generatedImages.createdAt,
          completedAt: generatedImages.completedAt,
        })
        .from(generatedImages)
        .where(eq(generatedImages.taskId, taskId))
        .limit(1);

      if (!image) {
        console.error(`❌ Imagem não encontrada:`, {
          taskId,
          userId,
          timestamp: new Date().toISOString(),
        });
        return {
          success: false,
          errors: {
            _form: ["Imagem não encontrada"],
          },
        };
      }

      // Verificar se a imagem pertence ao usuário autenticado
      if (image.userId !== userId) {
        console.error(`❌ Acesso negado - imagem não pertence ao usuário:`, {
          taskId,
          imageUserId: image.userId,
          requestingUserId: userId,
          timestamp: new Date().toISOString(),
        });
        return {
          success: false,
          errors: {
            _form: ["Acesso negado"],
          },
        };
      }

      console.log(`✅ Imagem encontrada com sucesso:`, {
        taskId,
        userId,
        status: image.status,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        data: {
          id: image.id,
          reservationId: image.reservationId,
          taskId: image.taskId,
          userId: image.userId,
          status: image.status,
          imageUrl: image.imageUrl,
          prompt: image.prompt,
          model: image.model,
          createdAt: image.createdAt,
          completedAt: image.completedAt,
        },
      };
    } catch (error) {
      console.error(`❌ Erro ao buscar imagem por taskId:`, {
        taskId,
        userId,
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
