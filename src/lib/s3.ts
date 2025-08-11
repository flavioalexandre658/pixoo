import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configuração do cliente S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'pixoo';

/**
 * Faz upload de uma imagem para o S3
 * @param imageBuffer Buffer da imagem
 * @param fileName Nome do arquivo (incluindo extensão)
 * @param contentType Tipo de conteúdo (ex: 'image/jpeg')
 * @returns URL pública da imagem no S3
 */
export async function uploadImageToS3(
  imageBuffer: Buffer,
  fileName: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  try {
    console.log('📤 Iniciando upload para S3:', {
      fileName,
      contentType,
      size: imageBuffer.length,
      bucket: BUCKET_NAME
    });

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: imageBuffer,
      ContentType: contentType,
      // Tornar a imagem pública para leitura
      ACL: 'public-read',
      // Adicionar metadados
      Metadata: {
        'uploaded-by': 'pixoo-app',
        'upload-timestamp': new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    // Construir URL pública
    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;
    
    console.log('✅ Upload para S3 concluído:', {
      fileName,
      publicUrl,
      size: imageBuffer.length
    });

    return publicUrl;
  } catch (error) {
    console.error('❌ Erro no upload para S3:', error);
    throw new Error(`Falha no upload para S3: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Gera uma URL assinada para acesso temporário a uma imagem no S3
 * @param fileName Nome do arquivo no S3
 * @param expiresIn Tempo de expiração em segundos (padrão: 1 hora)
 * @returns URL assinada
 */
export async function getSignedImageUrl(
  fileName: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    
    console.log('🔗 URL assinada gerada:', {
      fileName,
      expiresIn,
      signedUrl: signedUrl.substring(0, 100) + '...'
    });

    return signedUrl;
  } catch (error) {
    console.error('❌ Erro ao gerar URL assinada:', error);
    throw new Error(`Falha ao gerar URL assinada: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Gera um nome único para o arquivo baseado no taskId e timestamp
 * @param taskId ID da tarefa de geração
 * @param userId ID do usuário
 * @param extension Extensão do arquivo (padrão: 'jpg')
 * @returns Nome único do arquivo
 */
export function generateS3FileName(
  taskId: string,
  userId: string,
  extension: string = 'jpg'
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const shortTaskId = taskId.substring(0, 8);
  const shortUserId = userId.substring(0, 8);
  
  return `images/${shortUserId}/${timestamp}-${shortTaskId}.${extension}`;
}

/**
 * Baixa uma imagem de uma URL externa e retorna o buffer
 * @param imageUrl URL da imagem externa
 * @param maxRetries Número máximo de tentativas (padrão: 3)
 * @param timeoutMs Timeout em milissegundos (padrão: 60000)
 * @returns Buffer da imagem
 */
export async function downloadImageFromUrl(
  imageUrl: string, 
  maxRetries: number = 3,
  timeoutMs: number = 60000
): Promise<Buffer> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📥 Baixando imagem (tentativa ${attempt}/${maxRetries}):`, imageUrl);

      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
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

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log('✅ Imagem baixada com sucesso:', {
        url: imageUrl,
        size: buffer.length,
        contentType: response.headers.get('content-type'),
        attempt
      });

      return buffer;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Erro desconhecido');
      
      console.warn(`⚠️ Tentativa ${attempt}/${maxRetries} falhou:`, {
        url: imageUrl,
        error: lastError.message,
        willRetry: attempt < maxRetries
      });

      // Se não é a última tentativa, aguardar antes de tentar novamente
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Backoff exponencial
        console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error('❌ Todas as tentativas de download falharam:', {
    url: imageUrl,
    maxRetries,
    lastError: lastError?.message
  });
  
  throw new Error(`Falha ao baixar imagem após ${maxRetries} tentativas: ${lastError?.message || 'Erro desconhecido'}`);
}

/**
 * Deleta uma imagem do S3
 * @param fileName Nome do arquivo no S3
 * @returns Promise<void>
 */
export async function deleteImageFromS3(fileName: string): Promise<void> {
  try {
    console.log('🗑️ Deletando imagem do S3:', {
      fileName,
      bucket: BUCKET_NAME
    });

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    await s3Client.send(command);
    
    console.log('✅ Imagem deletada do S3 com sucesso:', {
      fileName
    });
  } catch (error) {
    console.error('❌ Erro ao deletar imagem do S3:', error);
    throw new Error(`Falha ao deletar imagem do S3: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Deleta múltiplas imagens do S3
 * @param fileNames Array com nomes dos arquivos no S3
 * @returns Promise<{ deleted: string[], errors: string[] }>
 */
export async function deleteMultipleImagesFromS3(fileNames: string[]): Promise<{ deleted: string[], errors: string[] }> {
  try {
    console.log('🗑️ Deletando múltiplas imagens do S3:', {
      count: fileNames.length,
      bucket: BUCKET_NAME
    });

    const objects = fileNames.map(fileName => ({ Key: fileName }));
    
    const command = new DeleteObjectsCommand({
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: objects,
        Quiet: false,
      },
    });

    const result = await s3Client.send(command);
    
    const deleted = result.Deleted?.map(obj => obj.Key || '') || [];
    const errors = result.Errors?.map(err => `${err.Key}: ${err.Message}`) || [];
    
    console.log('✅ Deleção em massa concluída:', {
      deleted: deleted.length,
      errors: errors.length
    });

    return { deleted, errors };
  } catch (error) {
    console.error('❌ Erro ao deletar múltiplas imagens do S3:', error);
    throw new Error(`Falha ao deletar múltiplas imagens do S3: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Extrai o nome do arquivo S3 de uma URL
 * @param imageUrl URL da imagem no S3
 * @returns Nome do arquivo ou null se não for uma URL do S3
 */
export function extractS3FileNameFromUrl(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);
    
    // Verificar se é uma URL do nosso bucket S3
    if (url.hostname === `${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`) {
      return url.pathname.substring(1); // Remove a barra inicial
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao extrair nome do arquivo da URL:', error);
    return null;
  }
}

export { s3Client, BUCKET_NAME };