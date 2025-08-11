"use server";

import { db } from "@/db";
import { generatedImages } from "@/db/schema";
import { eq, and, isNotNull, like } from "drizzle-orm";
import { uploadImageToS3, downloadImageFromUrl, generateS3FileName } from "@/lib/s3";
import { authActionClient } from "@/lib/safe-action";
import { z } from "zod";

const migrateToS3Schema = z.object({
  limit: z.number().int().positive().max(100).default(10),
  dryRun: z.boolean().default(false),
});

export const migrateImagesToS3 = authActionClient
  .inputSchema(migrateToS3Schema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx as { userId: string };
    const { limit, dryRun } = parsedInput;

    try {
      console.log('🔄 Iniciando migração de imagens para S3:', {
        userId,
        limit,
        dryRun,
        timestamp: new Date().toISOString()
      });

      // Buscar imagens que ainda estão hospedadas na BFL
      const imagesToMigrate = await db
        .select()
        .from(generatedImages)
        .where(
          and(
            eq(generatedImages.userId, userId),
            eq(generatedImages.status, "ready"),
            isNotNull(generatedImages.imageUrl),
            like(generatedImages.imageUrl, "https://delivery-us1.bfl.ai/%")
          )
        )
        .limit(limit);

      if (imagesToMigrate.length === 0) {
        return {
          success: true,
          data: {
            message: "Nenhuma imagem encontrada para migração",
            migratedCount: 0,
            totalFound: 0
          }
        };
      }

      console.log(`📋 Encontradas ${imagesToMigrate.length} imagens para migração`);

      if (dryRun) {
        return {
          success: true,
          data: {
            message: "Simulação concluída - nenhuma alteração foi feita",
            migratedCount: 0,
            totalFound: imagesToMigrate.length,
            images: imagesToMigrate.map(img => ({
              id: img.id,
              taskId: img.taskId,
              currentUrl: img.imageUrl,
              createdAt: img.createdAt
            }))
          }
        };
      }

      let migratedCount = 0;
      const errors: string[] = [];

      for (const image of imagesToMigrate) {
        try {
          console.log(`📤 Migrando imagem ${image.id}:`, {
            taskId: image.taskId,
            currentUrl: image.imageUrl
          });

          if (!image.imageUrl) {
            console.warn(`⚠️ Imagem ${image.id} não possui URL`);
            continue;
          }

          // Baixar a imagem da URL da BFL
          const imageBuffer = await downloadImageFromUrl(image.imageUrl);
          
          // Gerar nome único para o arquivo no S3
          const s3FileName = generateS3FileName(
            image.taskId,
            image.userId,
            'jpg'
          );
          
          // Fazer upload para o S3
          const s3ImageUrl = await uploadImageToS3(
            imageBuffer,
            s3FileName,
            'image/jpeg'
          );
          
          // Atualizar o registro no banco de dados
          await db
            .update(generatedImages)
            .set({ imageUrl: s3ImageUrl })
            .where(eq(generatedImages.id, image.id));
          
          console.log(`✅ Imagem ${image.id} migrada com sucesso:`, {
            taskId: image.taskId,
            oldUrl: image.imageUrl,
            newUrl: s3ImageUrl
          });
          
          migratedCount++;
        } catch (error) {
          const errorMessage = `Erro ao migrar imagem ${image.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
          console.error(`❌ ${errorMessage}`);
          errors.push(errorMessage);
        }
      }

      console.log('✅ Migração concluída:', {
        userId,
        totalFound: imagesToMigrate.length,
        migratedCount,
        errorsCount: errors.length
      });

      return {
        success: true,
        data: {
          message: `Migração concluída: ${migratedCount}/${imagesToMigrate.length} imagens migradas`,
          migratedCount,
          totalFound: imagesToMigrate.length,
          errors: errors.length > 0 ? errors : undefined
        }
      };
    } catch (error) {
      console.error('❌ Erro na migração para S3:', error);
      return {
        success: false,
        errors: {
          _form: [error instanceof Error ? error.message : 'Erro interno do servidor']
        }
      };
    }
  });

// Action para migrar todas as imagens do sistema (apenas para admins)
export async function migrateAllImagesToS3(
  limit: number = 50,
  dryRun: boolean = false
) {
  try {
    console.log('🔄 Iniciando migração global de imagens para S3:', {
      limit,
      dryRun,
      timestamp: new Date().toISOString()
    });

    // Buscar todas as imagens que ainda estão hospedadas na BFL
    const imagesToMigrate = await db
      .select()
      .from(generatedImages)
      .where(
        and(
          eq(generatedImages.status, "ready"),
          isNotNull(generatedImages.imageUrl),
          like(generatedImages.imageUrl, "https://delivery-us1.bfl.ai/%")
        )
      )
      .limit(limit);

    if (imagesToMigrate.length === 0) {
      return {
        success: true,
        message: "Nenhuma imagem encontrada para migração",
        migratedCount: 0,
        totalFound: 0
      };
    }

    console.log(`📋 Encontradas ${imagesToMigrate.length} imagens para migração global`);

    if (dryRun) {
      return {
        success: true,
        message: "Simulação global concluída - nenhuma alteração foi feita",
        migratedCount: 0,
        totalFound: imagesToMigrate.length,
        images: imagesToMigrate.map(img => ({
          id: img.id,
          taskId: img.taskId,
          userId: img.userId,
          currentUrl: img.imageUrl,
          createdAt: img.createdAt
        }))
      };
    }

    let migratedCount = 0;
    const errors: string[] = [];

    for (const image of imagesToMigrate) {
      try {
        console.log(`📤 Migrando imagem global ${image.id}:`, {
          taskId: image.taskId,
          userId: image.userId,
          currentUrl: image.imageUrl
        });

        if (!image.imageUrl) {
          console.warn(`⚠️ Imagem ${image.id} não possui URL`);
          continue;
        }

        // Baixar a imagem da URL da BFL
        const imageBuffer = await downloadImageFromUrl(image.imageUrl);
        
        // Gerar nome único para o arquivo no S3
        const s3FileName = generateS3FileName(
          image.taskId,
          image.userId,
          'jpg'
        );
        
        // Fazer upload para o S3
        const s3ImageUrl = await uploadImageToS3(
          imageBuffer,
          s3FileName,
          'image/jpeg'
        );
        
        // Atualizar o registro no banco de dados
        await db
          .update(generatedImages)
          .set({ imageUrl: s3ImageUrl })
          .where(eq(generatedImages.id, image.id));
        
        console.log(`✅ Imagem global ${image.id} migrada com sucesso:`, {
          taskId: image.taskId,
          userId: image.userId,
          oldUrl: image.imageUrl,
          newUrl: s3ImageUrl
        });
        
        migratedCount++;
      } catch (error) {
        const errorMessage = `Erro ao migrar imagem ${image.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        console.error(`❌ ${errorMessage}`);
        errors.push(errorMessage);
      }
    }

    console.log('✅ Migração global concluída:', {
      totalFound: imagesToMigrate.length,
      migratedCount,
      errorsCount: errors.length
    });

    return {
      success: true,
      message: `Migração global concluída: ${migratedCount}/${imagesToMigrate.length} imagens migradas`,
      migratedCount,
      totalFound: imagesToMigrate.length,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    console.error('❌ Erro na migração global para S3:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    };
  }
}