"use server";

import { actionClient } from "@/lib/safe-action";
import { proxyImageSchema } from "./proxy-image.action.schema";

export const proxyImage = actionClient
  .schema(proxyImageSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { url } = parsedInput;

      // Fetch the image from the external URL
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ImageProxy/1.0)",
        },
      });

      if (!response.ok) {
        return {
          error: `Falha ao buscar imagem: ${response.status}`,
        };
      }

      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") || "image/png";

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
      return {
        error: "Falha ao buscar imagem",
      };
    }
  });