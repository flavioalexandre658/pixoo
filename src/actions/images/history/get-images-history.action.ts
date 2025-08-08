'use server';

import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { authActionClient } from '@/lib/safe-action';
import { generatedImages } from '@/db/schema';

import { getImagesHistorySchema } from './get-images-history.action.schema';

export const getImagesHistory = authActionClient
    .inputSchema(getImagesHistorySchema)
    .action(async ({ parsedInput, ctx }) => {
        const { userId } = ctx as { userId: string };
        const { limit } = parsedInput;

        try {
            console.log(`🔄 Buscando histórico de imagens:`, {
                userId,
                limit,
                timestamp: new Date().toISOString()
            });

            // Buscar imagens do usuário
            const images = await db
                .select()
                .from(generatedImages)
                .where(eq(generatedImages.userId, userId))
                .orderBy(desc(generatedImages.createdAt))
                .limit(limit);

            console.log(`✅ Histórico de imagens obtido com sucesso:`, {
                userId,
                imagesCount: images.length,
                limit,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                data: images,
            };
        } catch (error) {
            console.error(`❌ Erro ao buscar histórico de imagens:`, {
                userId,
                limit,
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