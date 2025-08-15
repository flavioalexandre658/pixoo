"use server";

import { db } from "@/db";
import { generatedImages, modelCosts, users } from "@/db/schema";
import { desc, eq, and, type SQL } from "drizzle-orm";
import { createSafeActionClient } from "next-safe-action";
import { getPublicImagesSchema } from "./get-public-images.action.schema";

const action = createSafeActionClient();

export const getPublicImages = action
  .schema(getPublicImagesSchema)
  .action(async ({ parsedInput: { limit = 10, offset = 0, category } }) => {
    try {
      let whereCondition: SQL<unknown> = eq(generatedImages.isPublic, true);

      if (category && category !== "all") {
        const categoryCondition = and(
          eq(generatedImages.isPublic, true),
          eq(generatedImages.category, category)
        );
        if (categoryCondition) {
          whereCondition = categoryCondition;
        }
      }

      const images = await db
        .select({
          id: generatedImages.id,
          prompt: generatedImages.prompt,
          imageUrl: generatedImages.imageUrl,
          model: generatedImages.model,
          modelName: modelCosts.modelName,
          aspectRatio: generatedImages.aspectRatio,
          likes: generatedImages.likes,
          category: generatedImages.category,
          createdAt: generatedImages.createdAt,
          user: {
            name: users.name,
            email: users.email,
          },
        })
        .from(generatedImages)
        .leftJoin(modelCosts, eq(generatedImages.model, modelCosts.modelId))
        .leftJoin(users, eq(generatedImages.userId, users.id))
        .where(whereCondition)
        .orderBy(desc(generatedImages.likes), desc(generatedImages.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        success: true,
        data: images,
        hasMore: images.length === limit, // Se retornou o limite completo, pode haver mais
      };
    } catch (error) {
      console.error("Error fetching public images:", error);
      return {
        success: false,
        serverError: "Failed to fetch public images",
      };
    }
  });
