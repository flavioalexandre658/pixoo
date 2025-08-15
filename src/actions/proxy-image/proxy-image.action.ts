"use server";

import { actionClient } from "@/lib/safe-action";
import { proxyImageSchema } from "./proxy-image.action.schema";

export const proxyImage = actionClient
  .schema(proxyImageSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { url } = parsedInput;

      // Headers específicos para diferentes domínios
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (compatible; ImageProxy/1.0)",
      };

      // Headers específicos para together.ai
      if (url.includes("together.ai") || url.includes("together-ai")) {
        headers["Accept"] = "image/*,*/*;q=0.8";
        headers["Referer"] = "https://together.ai/";
      }

      // Fetch the image from the external URL
      const response = await fetch(url, {
        headers,
        // Adicionar timeout para evitar travamentos
        signal: AbortSignal.timeout(30000), // 30 segundos
      });

      if (!response.ok) {
        return {
          error: `Falha ao buscar imagem: ${response.status} ${response.statusText}`,
        };
      }

      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") || "image/png";

      // Verificar se é realmente uma imagem
      if (!contentType.startsWith("image/")) {
        return {
          error: "URL não aponta para uma imagem válida",
        };
      }

      // Convert ArrayBuffer to base64 for return
      const base64Image = Buffer.from(imageBuffer).toString("base64");
      const dataUrl = `data:${contentType};base64,${base64Image}`;

      return {
        success: true,
        imageData: dataUrl,
        contentType,
      };
    } catch (error) {
      console.error("Erro ao fazer proxy da imagem:", error);

      // Mensagens de erro mais específicas
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          return {
            error: "Timeout ao buscar imagem - URL pode estar inacessível",
          };
        }
        if (error.message.includes("fetch")) {
          return {
            error: "Erro de rede ao buscar imagem",
          };
        }
      }

      return {
        error: "Falha ao buscar imagem",
      };
    }
  });
