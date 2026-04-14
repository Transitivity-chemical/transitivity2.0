import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRole } from '@/lib/access';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const caller = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  const admin = caller ? isAdminRole(caller.role) : false;

  const { searchParams } = new URL(request.url);
  const targetUser = admin ? (searchParams.get('userId') || session.user.id) : session.user.id;
  const role = searchParams.get('role'); // 'INPUT' | 'OUTPUT' | null
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

  const files = await prisma.fileUpload.findMany({
    where: {
      userId: targetUser,
      ...(role === 'INPUT' || role === 'OUTPUT' ? { resourceRole: role } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      filename: true,
      originalName: true,
      sizeBytes: true,
      mimeType: true,
      fileType: true,
      resourceRole: true,
      resourceType: true,
      resourceId: true,
      sha256: true,
      createdAt: true,
    },
  });

  const totalBytes = files.reduce((s, f) => s + f.sizeBytes, 0);

  return NextResponse.json({ files, totalBytes });
}
