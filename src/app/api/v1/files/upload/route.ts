import path from 'path';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { UploadFileType } from '@prisma/client';
import { storeAndPersist } from '@/lib/bucket-client';

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_EXTENSIONS = new Set([
  '.log', '.out', '.gjf', '.com', '.xyz', '.mol', '.txt', '.dat', '.csv',
]);

const EXTENSION_TO_FILE_TYPE: Record<string, UploadFileType> = {
  '.log': 'GAUSSIAN_LOG',
  '.out': 'GAUSSIAN_OUT',
  '.gjf': 'GJF_INPUT',
  '.com': 'GJF_INPUT',
  '.xyz': 'XYZ_GEOMETRY',
  '.txt': 'RATE_DATA_TXT',
  '.dat': 'RATE_DATA_DAT',
  '.csv': 'RATE_DATA_CSV',
  '.mol': 'OTHER',
};

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const resourceType = (formData.get('resourceType') as string | null) || null;
    const resourceId = (formData.get('resourceId') as string | null) || null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
    }

    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `File type not allowed. Allowed extensions: ${[...ALLOWED_EXTENSIONS].join(', ')}` },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = EXTENSION_TO_FILE_TYPE[ext] ?? 'OTHER';

    const upload = await storeAndPersist({
      userId: session.user.id,
      filename: originalName, // keep original filename — bucket generates its own UUID prefix
      originalName,
      data: buffer,
      mimeType: file.type || 'application/octet-stream',
      fileType,
      role: 'INPUT',
      resourceType,
      resourceId,
    });

    return NextResponse.json(
      {
        id: upload.id,
        filename: upload.filename,
        originalName: upload.originalName,
        sizeBytes: upload.sizeBytes,
        fileType: upload.fileType,
        sha256: upload.sha256,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
