import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileUploadId } = (await request.json()) as { fileUploadId: string };

    if (!fileUploadId) {
      return NextResponse.json({ error: 'fileUploadId required' }, { status: 400 });
    }

    const upload = await prisma.fileUpload.findFirst({
      where: { id: fileUploadId, userId: session.user.id },
    });

    if (!upload) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = await readFile(upload.storagePath);
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([fileBuffer], { type: upload.mimeType || 'application/octet-stream' }),
      upload.originalName,
    );

    const response = await fetch(`${process.env.FASTAPI_URL || 'http://pitomba.ueg.br'}/api/v1/files/parse`, {
      method: 'POST',
      body: formData,
    });

    const parsed = await response.json().catch(() => ({ detail: 'FastAPI error' }));

    if (!response.ok) {
      const detail =
        typeof parsed?.detail === 'string'
          ? parsed.detail
          : Array.isArray(parsed?.detail)
            ? JSON.stringify(parsed.detail)
            : 'Parse failed';

      return NextResponse.json({ error: detail }, { status: response.status });
    }

    return NextResponse.json(parsed?.data || parsed);
  } catch (error) {
    console.error('Parse error:', error);
    const message = error instanceof Error ? error.message : 'Parse failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
