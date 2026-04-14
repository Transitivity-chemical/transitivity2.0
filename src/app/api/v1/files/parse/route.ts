import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { downloadFromBucket, storeAndPersist } from '@/lib/bucket-client';
import type { UploadFileType } from '@prisma/client';
import path from 'path';

const EXTENSION_TO_FILE_TYPE: Record<string, UploadFileType> = {
  '.log': 'GAUSSIAN_LOG',
  '.out': 'GAUSSIAN_OUT',
  '.gjf': 'GJF_INPUT',
  '.com': 'GJF_INPUT',
  '.xyz': 'XYZ_GEOMETRY',
  '.txt': 'RATE_DATA_TXT',
};

/**
 * Two calling patterns:
 *  1. Multipart form with `file` — upload to bucket, parse, return parsed data + fileId
 *  2. JSON body with { fileUploadId } — re-parse a file already in the bucket
 *
 * Response shape: { fileId, storagePath, ...parsedFields }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const contentType = request.headers.get('content-type') || '';

    let bytes: Uint8Array;
    let originalName: string;
    let mimeType: string;
    let fileId: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file') as File | null;
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

      bytes = new Uint8Array(await file.arrayBuffer());
      originalName = file.name;
      mimeType = file.type || 'application/octet-stream';

      // Persist to bucket so future rerun / admin can re-access.
      const ext = path.extname(originalName).toLowerCase();
      const fileType = EXTENSION_TO_FILE_TYPE[ext] ?? 'OTHER';
      const upload = await storeAndPersist({
        userId,
        filename: originalName,
        originalName,
        data: Buffer.from(bytes),
        mimeType,
        fileType,
        role: 'INPUT',
      });
      fileId = upload.id;
    } else {
      const body = (await request.json()) as { fileUploadId?: string };
      if (!body.fileUploadId) {
        return NextResponse.json({ error: 'fileUploadId required' }, { status: 400 });
      }
      const upload = await prisma.fileUpload.findFirst({
        where: { id: body.fileUploadId, userId },
      });
      if (!upload) return NextResponse.json({ error: 'File not found' }, { status: 404 });

      bytes = await downloadFromBucket({ userId, storagePath: upload.storagePath });
      originalName = upload.originalName;
      mimeType = upload.mimeType;
      fileId = upload.id;
    }

    // Forward raw bytes to FastAPI parser
    const formData = new FormData();
    formData.append('file', new Blob([bytes as BlobPart], { type: mimeType }), originalName);

    const response = await fetch(
      `${process.env.FASTAPI_URL || 'http://pitomba.ueg.br'}/api/v1/files/parse`,
      { method: 'POST', body: formData, cache: 'no-store' },
    );
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

    const parsedData = parsed?.data ?? parsed;
    return NextResponse.json({ ...parsedData, fileId });
  } catch (error) {
    console.error('Parse error:', error);
    const message = error instanceof Error ? error.message : 'Parse failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
