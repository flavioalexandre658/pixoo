import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  // Lista expandida de domínios autorizados
  const authorizedDomains = [
    "https://delivery-us1.bfl.ai/",
    "https://pixoo-images.s3.us-east-1.amazonaws.com/",
    "https://together.ai/",
    "https://api.together.ai/",
    "https://together-ai.s3.amazonaws.com/",
    "https://images.together.ai/",
    "https://cdn.together.ai/",
    "https://storage.googleapis.com/",
    "https://firebasestorage.googleapis.com/",
    "https://imgur.com/",
    "https://i.imgur.com/",
    "https://cdn.openai.com/",
    "https://oaidalleapiprodscus.blob.core.windows.net/",
  ];

  const isValidDomain = authorizedDomains.some((domain) =>
    imageUrl.startsWith(domain)
  );

  if (!isValidDomain) {
    console.log("❌ Domínio não autorizado:", imageUrl);
    return NextResponse.json(
      {
        error: "Unauthorized domain",
        allowedDomains: authorizedDomains.map((d) =>
          d.replace("https://", "").replace("/", "")
        ),
      },
      { status: 403 }
    );
  }

  try {
    console.log("🔄 Proxy tentando buscar imagem:", imageUrl);

    // Criar AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("⏰ Timeout do proxy após 45 segundos");
      controller.abort();
    }, 45000); // 45 segundos

    try {
      // Headers otimizados para melhor compatibilidade
      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          Accept: "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          "Sec-Fetch-Dest": "image",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "cross-site",
          Referer: "https://pixoo.app/",
        },
      });

      clearTimeout(timeoutId);

      console.log(
        "📡 Resposta do proxy:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error(
          "❌ Erro na resposta do proxy:",
          response.status,
          errorText
        );
        throw new Error(
          `Failed to fetch image: ${response.status} ${response.statusText}`
        );
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      const imageBuffer = await response.arrayBuffer();

      console.log(
        "✅ Imagem carregada via proxy com sucesso, tamanho:",
        imageBuffer.byteLength,
        "bytes"
      );

      // Headers otimizados para mobile
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Content-Length": imageBuffer.byteLength.toString(),
          "Content-Disposition": 'attachment; filename="image.png"',
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error("❌ Erro no proxy de imagem:", error);

    // Retornar erro mais específico
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return NextResponse.json(
          {
            error:
              "Request timeout - A imagem pode estar muito grande ou o servidor está lento",
          },
          { status: 408 }
        );
      }
      if (error.message.includes("fetch")) {
        return NextResponse.json(
          { error: "Network error - Verifique sua conexão com a internet" },
          { status: 502 }
        );
      }
      if (error.message.includes("CORS")) {
        return NextResponse.json(
          {
            error:
              "CORS error - O servidor da imagem não permite downloads diretos",
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to fetch image",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Tente novamente ou use uma imagem de outro servidor",
      },
      { status: 500 }
    );
  }
}

// Adicionar suporte para OPTIONS (preflight CORS)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
