"use server";

import { actionClient } from "@/lib/safe-action";
import { getStatusSchema } from "./get-status.action.schema";
import { db } from "@/db";
import { generatedImages } from "@/db/schema";
import { eq } from "drizzle-orm";

export const getImageGenerationStatus = actionClient
  .schema(getStatusSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { taskId } = parsedInput;

      const [task] = await db
        .select()
        .from(generatedImages)
        .where(eq(generatedImages.taskId, taskId));

      if (!task) {
        return {
          error: "Tarefa não encontrada",
        };
      }

      let frontendStatus = task.status;
      if (task.status === "pending") frontendStatus = "Pending";
      else if (task.status === "ready") frontendStatus = "Ready";
      else if (task.status === "error") frontendStatus = "Error";

      return {
        status: frontendStatus,
        taskId: taskId,
        imageUrl: task.imageUrl || null,
      };
    } catch (error) {
      console.error("Erro ao obter status da geração:", error);
      return {
        error: "Erro interno do servidor",
      };
    }
  });