import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reactions = await prisma.reaction.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        reactionType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        species: { select: { id: true, role: true, label: true } },
      },
    });

    return NextResponse.json(reactions);
  } catch (error) {
    console.error('List reactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, reactionType, energyType } = body as {
      name: string;
      reactionType: 'UNIMOLECULAR' | 'BIMOLECULAR';
      energyType?: 'En' | 'Ent' | 'EnG';
    };

    if (!name || !reactionType) {
      return NextResponse.json({ error: 'name and reactionType required' }, { status: 400 });
    }

    const reaction = await prisma.reaction.create({
      data: {
        userId: session.user.id,
        name,
        reactionType,
        energyType: energyType || 'En',
        status: 'DRAFT',
      },
    });

    return NextResponse.json(reaction, { status: 201 });
  } catch (error) {
    console.error('Create reaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
