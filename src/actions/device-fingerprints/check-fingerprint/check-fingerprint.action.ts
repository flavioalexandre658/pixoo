"use server";

import { actionClient } from "@/lib/safe-action";
import { checkFingerprintSchema, CheckFingerprintInput } from "./check-fingerprint.schema";
import { db } from "@/db";
import { deviceFingerprints } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

interface CheckFingerprintResult {
  canReceiveCredits: boolean;
  fingerprintId?: string;
  hasReceivedCredits: boolean;
  message: string;
}

const handler = async (data: CheckFingerprintInput): Promise<CheckFingerprintResult> => {
  try {
    // Obter IP real da requisição
    const headersList = await headers();
    const realIP = headersList.get('x-real-client-ip') || 
                   headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   headersList.get('x-real-ip') || 
                   'unknown';

    // Verificar se o fingerprint já existe
    const existingFingerprint = await db
      .select()
      .from(deviceFingerprints)
      .where(eq(deviceFingerprints.fingerprint, data.fingerprint))
      .limit(1);

    if (existingFingerprint.length > 0) {
      const fingerprint = existingFingerprint[0];
      
      // Atualizar última visualização
      await db
        .update(deviceFingerprints)
        .set({ 
          lastSeenAt: new Date(),
          ipAddress: realIP,
          userAgent: data.userAgent,
        })
        .where(eq(deviceFingerprints.id, fingerprint.id));

      return {
        canReceiveCredits: !fingerprint.hasReceivedCredits,
        fingerprintId: fingerprint.id,
        hasReceivedCredits: fingerprint.hasReceivedCredits,
        message: fingerprint.hasReceivedCredits 
          ? "Este dispositivo já recebeu créditos gratuitos" 
          : "Dispositivo pode receber créditos"
      };
    }

    // Criar novo fingerprint se não existir
    const newFingerprint = await db
      .insert(deviceFingerprints)
      .values({
        fingerprint: data.fingerprint,
        ipAddress: realIP,
        userAgent: data.userAgent,
        screenResolution: data.screenResolution,
        timezone: data.timezone,
        language: data.language,
        platform: data.platform,
        hasReceivedCredits: false,
      })
      .returning();

    return {
      canReceiveCredits: true,
      fingerprintId: newFingerprint[0].id,
      hasReceivedCredits: false,
      message: "Novo dispositivo registrado, pode receber créditos"
    };
  } catch (error) {
    console.error("Erro ao verificar fingerprint:", error);
    throw new Error("Erro interno do servidor");
  }
};

export const checkFingerprint = actionClient.inputSchema(checkFingerprintSchema).action(async ({ parsedInput }) => {
  return await handler(parsedInput);
});