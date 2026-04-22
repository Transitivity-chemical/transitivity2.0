import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { deleteFromBucket } from '@/lib/bucket-client';
import { isAdminRole } from '@/lib/access';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [file, caller] = await Promise.all([
      prisma.fileUpload.findUnique({ where: { id } }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      }),
    ]);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const admin = caller ? isAdminRole(caller.role) : false;
    if (file.userId !== session.user.id && !admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from bucket; do not block DB cleanup on bucket errors so a
    // disappeared blob can't leave an undeletable DB row.
    try {
      await deleteFromBucket({ userId: file.userId, storagePath: file.storagePath });
    } catch (err) {
      console.warn('bucket delete warning', err);
    }

    await prisma.fileUpload.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('File delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
