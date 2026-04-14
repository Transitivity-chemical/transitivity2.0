import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = (await request.json()) as { fullName?: string };
  const name = body.fullName?.trim();
  if (!name || name.length < 2 || name.length > 120) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 422 });
  }
  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { fullName: name },
    select: { id: true, fullName: true },
  });
  return NextResponse.json({ data: updated });
}
