"use server";

import { db } from "@/db";
import { generatedImages } from "@/db/schema";
import { authActionClient } from "@/lib/safe-action";

import { upsertImageSchema } from "./upsert-image.action.schema";

export const upsertImage = authActionClient
  .inputSchema(upsertImageSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx as { userId: string };

    try {
      const inserted = await db
        .insert(generatedImages)
        .values({
          ...parsedInput,
          userId,
        })
        .onConflictDoUpdate({
          target: [generatedImages.id],
          set: {
            ...parsedInput,
            userId,
          },
        })
        .returning(); // <— aqui
      // `inserted` é um array com as linhas afetadas; em geral só vem 1
      const image = inserted[0];

      return {
        success: true,
        data: image,
      };
    } catch (error) {
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
