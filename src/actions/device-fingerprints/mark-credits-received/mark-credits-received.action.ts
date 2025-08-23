"use server";

import { actionClient } from "@/lib/safe-action";
import { markCreditsReceivedSchema, MarkCreditsReceivedInput } from "./mark-credits-received.schema";
import { db } from "@/db";
import { deviceFingerprints, deviceFingerprintUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

interface MarkCreditsReceivedResult {
  success: boolean;
  message: string;
}

const handler = async (data: MarkCreditsReceivedInput): Promise<MarkCreditsReceivedResult> => {
  try {
    // Marcar que o dispositivo já recebeu créditos
    await db
      .update(deviceFingerprints)
      .set({ 
        hasReceivedCredits: true,
        firstUserId: data.userId,
      })
      .where(eq(deviceFingerprints.id, data.fingerprintId));

    // Registrar a associação entre dispositivo e usuário
    await db
      .insert(deviceFingerprintUsers)
      .values({
        deviceFingerprintId: data.fingerprintId,
        userId: data.userId,
      });

    return {
      success: true,
      message: "Dispositivo marcado como tendo recebido créditos"
    };
  } catch (error) {
    console.error("Erro ao marcar créditos recebidos:", error);
    throw new Error("Erro interno do servidor");
  }
};

export const markCreditsReceived = actionClient.inputSchema(markCreditsReceivedSchema).action(async ({ parsedInput }) => {
  return await handler(parsedInput);
});