"use server";
import { db } from "@/db";
import { authActionClient } from "@/lib/safe-action";
import { modelCosts } from "@/db/schema";
import { eq } from "drizzle-orm";

import { getModelCostSchema } from "./get-model-cost.action.schema";

export const getModelCost = authActionClient
  .inputSchema(getModelCostSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { modelId } = parsedInput;

      // Buscar modelo específico no banco de dados
      const model = await db
        .select()
        .from(modelCosts)
        .where(eq(modelCosts.modelId, modelId))
        .limit(1);

      if (!model.length) {
        return {
          success: false,
          errors: {
            _form: [`Modelo ${modelId} não encontrado`],
          },
        };
      }

      return {
        success: true,
        result: model[0],
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