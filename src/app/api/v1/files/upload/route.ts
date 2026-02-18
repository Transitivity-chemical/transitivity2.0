import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { UploadFileType } from '@prisma/client';

const UPLOAD_DIR = '/tmp/transitivity-uploads';
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 50MB.` },
        { status: 400 },
      );
    }

    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `File type not allowed. Allowed extensions: ${[...ALLOWED_EXTENSIONS].join(', ')}` },
        { status: 400 },
      );
    }

    const uuid = randomUUID();
    const filename = `${uuid}${ext}`;
    const storagePath = path.join(UPLOAD_DIR, filename);

    await mkdir(UPLOAD_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(storagePath, buffer);

    const fileType = EXTENSION_TO_FILE_TYPE[ext] ?? 'OTHER';

    const upload = await prisma.fileUpload.create({
      data: {
        userId: session.user.id,
        filename,
        originalName,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        storagePath,
        fileType,
      },
      select: {
        id: true,
        filename: true,
        originalName: true,
        sizeBytes: true,
        fileType: true,
      },
    });

    return NextResponse.json(upload, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
