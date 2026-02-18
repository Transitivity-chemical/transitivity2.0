import { auth } from '@/lib/auth';
import { proxyToFastAPI } from '@/lib/fastapi-proxy';
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

    const content = await readFile(upload.storagePath, 'utf-8');

    const parsed = await proxyToFastAPI<Record<string, unknown>>('/api/v1/files/parse', {
      method: 'POST',
      body: JSON.stringify({
        content,
        filename: upload.originalName,
      }),
    });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json({ error: 'Parse failed' }, { status: 500 });
  }
}
