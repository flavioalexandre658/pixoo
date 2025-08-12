import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToS3, generateS3FileName } from '@/lib/s3';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Validar tamanho do arquivo (20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 20MB.' },
        { status: 400 }
      );
    }

    // Converter arquivo para buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = generateS3FileName(
      `${type}-${Date.now()}`,
      session.user.id,
      fileExtension
    );

    // Fazer upload para S3
    const s3Url = await uploadImageToS3(buffer, fileName, file.type);

    console.log('✅ Upload concluído:', {
      fileName,
      s3Url,
      fileSize: file.size,
      userId: session.user.id
    });

    return NextResponse.json({
      success: true,
      url: s3Url,
      fileName,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('❌ Erro no upload:', error);
    return NextResponse.json(
      { 
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}