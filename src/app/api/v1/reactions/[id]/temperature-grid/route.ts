import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reactionId } = await params;

    const reaction = await prisma.reaction.findFirst({
      where: { id: reactionId, userId: session.user.id },
    });

    if (!reaction) {
      return NextResponse.json({ error: 'Reaction not found' }, { status: 404 });
    }

    const body = await request.json();
    const { gridType, minTemp, maxTemp, step, values } = body as {
      gridType: 'DEFAULT' | 'CUSTOM' | 'RANGE';
      minTemp?: number;
      maxTemp?: number;
      step?: number;
      values?: number[];
    };

    let computedValues: number[] = values || [];

    if (gridType === 'RANGE' && minTemp && maxTemp && step) {
      computedValues = [];
      for (let t = minTemp; t <= maxTemp; t += step) {
        computedValues.push(Math.round(t * 100) / 100);
      }
    } else if (gridType === 'DEFAULT') {
      computedValues = [];
      for (let t = 200; t <= 2000; t += 50) {
        computedValues.push(t);
      }
    }

    const grid = await prisma.temperatureGrid.upsert({
      where: { reactionId },
      create: { reactionId, gridType, minTemp, maxTemp, step, values: computedValues },
      update: { gridType, minTemp, maxTemp, step, values: computedValues },
    });

    return NextResponse.json(grid);
  } catch (error) {
    console.error('Temperature grid error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
