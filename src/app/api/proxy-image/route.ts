import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  // Verificar se a URL é de um domínio autorizado para segurança
  const isValidDomain = imageUrl.startsWith('https://delivery-us1.bfl.ai/') || 
                       imageUrl.startsWith('https://pixoo-images.s3.us-east-1.amazonaws.com/');
  
  if (!isValidDomain) {
    return NextResponse.json({ error: 'Unauthorized domain' }, { status: 403 });
  }

  try {
    console.log('🔄 Proxy tentando buscar imagem:', imageUrl);
    
    // Criar AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ Timeout do proxy após 45 segundos');
      controller.abort();
    }, 45000); // 45 segundos

    try {
      // Fetch the image from the external URL com timeout e headers robustos
      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'image',
          'Sec-Fetch-Mode': 'no-cors',
          'Sec-Fetch-Site': 'cross-site',
        },
      });
      
      clearTimeout(timeoutId);

      console.log('📡 Resposta do proxy:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ Erro na resposta do proxy:', response.status, errorText);
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const imageBuffer = await response.arrayBuffer();
      
      console.log('✅ Imagem carregada via proxy com sucesso, tamanho:', imageBuffer.byteLength, 'bytes');

      // Return the image with appropriate headers
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Length': imageBuffer.byteLength.toString(),
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('❌ Erro no proxy de imagem:', error);
    
    // Retornar erro mais específico
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout' },
          { status: 408 }
        );
      }
      if (error.message.includes('fetch')) {
        return NextResponse.json(
          { error: 'Network error' },
          { status: 502 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}