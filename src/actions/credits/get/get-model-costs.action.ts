"use server";
import { db } from "@/db";
import { authActionClient } from "@/lib/safe-action";
import { modelCosts } from "@/db/schema";

import { getModelCostsSchema } from "./get-model-costs.action.schema";

export const getModelCosts = authActionClient
  .inputSchema(getModelCostsSchema)
  .action(async () => {
    try {
      // Obter créditos do usuário
      const models = await db
        .select()
        .from(modelCosts)
        .orderBy(modelCosts.credits);

      if (!models.length) {
        return {
          success: false,
          errors: {
            _form: ["Nenhum modelo encontrado"],
          },
        };
      }

      return {
        success: true,
        result: models,
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
