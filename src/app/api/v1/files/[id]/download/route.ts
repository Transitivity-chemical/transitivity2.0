export const maxDuration = 60;
export const runtime = 'nodejs';

import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { downloadFromBucket } from '@/lib/bucket-client';
import { isAdminRole } from '@/lib/access';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const caller = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  const admin = caller ? isAdminRole(caller.role) : false;

  const file = await prisma.fileUpload.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (file.userId !== session.user.id && !admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const bytes = await downloadFromBucket({
      userId: file.userId,
      storagePath: file.storagePath,
      admin,
    });
    return new NextResponse(Buffer.from(bytes) as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType || 'application/octet-stream',
        'Content-Length': String(bytes.byteLength),
        'Content-Disposition': `attachment; filename="${file.originalName}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Download failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
