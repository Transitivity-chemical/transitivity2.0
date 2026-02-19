import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; speciesId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reactionId, speciesId } = await params;

    const reaction = await prisma.reaction.findFirst({
      where: { id: reactionId, userId: session.user.id },
    });

    if (!reaction) {
      return NextResponse.json({ error: 'Reaction not found' }, { status: 404 });
    }

    await prisma.species.delete({ where: { id: speciesId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete species error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; speciesId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reactionId, speciesId } = await params;

    const reaction = await prisma.reaction.findFirst({
      where: { id: reactionId, userId: session.user.id },
    });

    if (!reaction) {
      return NextResponse.json({ error: 'Reaction not found' }, { status: 404 });
    }

    const body = await request.json();
    const species = await prisma.species.update({
      where: { id: speciesId },
      data: body,
    });

    return NextResponse.json(species);
  } catch (error) {
    console.error('Update species error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
