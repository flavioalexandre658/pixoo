'use server';

import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { authActionClient } from '@/lib/safe-action';
import { generatedImages } from '@/db/schema';

import { getImageByTaskIdSchema } from './get-image-by-task-id.action.schema';

export const getImageByTaskId = authActionClient
    .inputSchema(getImageByTaskIdSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { userId } = ctx as { userId: string };
        const { taskId } = parsedInput;

        try {
            console.log(`🔄 Buscando imagem por taskId:`, {
                userId,
                taskId,
                timestamp: new Date().toISOString()
            });

            // Buscar a imagem no banco de dados
            const [task] = await db
                .select()
                .from(generatedImages)
                .where(eq(generatedImages.taskId, taskId))
                .limit(1);

            if (!task) {
                console.error(`❌ Task não encontrada:`, {
                    taskId,
                    userId,
                    timestamp: new Date().toISOString()
                });
                return {
                    success: false,
                    errors: {
                        _form: ["Task não encontrada"],
                    },
                };
            }

            // Verificar se a imagem pertence ao usuário autenticado
            if (task.userId !== userId) {
                console.error(`❌ Acesso negado - imagem não pertence ao usuário:`, {
                    taskId,
                    imageUserId: task.userId,
                    requestingUserId: userId,
                    timestamp: new Date().toISOString()
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
                status: task.status,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                data: {
                    taskId: task.taskId,
                    status: task.status,
                    imageUrl: task.imageUrl,
                    prompt: task.prompt,
                    model: task.model,
                    createdAt: task.createdAt,
                    completedAt: task.completedAt,
                },
            };
        } catch (error) {
            console.error(`❌ Erro ao buscar imagem por taskId:`, {
                taskId,
                userId,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
            });
            return {
                success: false,
                errors: {
                    _form: [error instanceof Error ? error.message : 'Erro interno do servidor'],
                },
            };
        }
    });