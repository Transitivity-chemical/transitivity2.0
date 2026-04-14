import { auth } from '@/lib/auth';
import { proxyToFastAPI } from '@/lib/fastapi-proxy';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Marcus Theory rate constant proxy.
 * Reference: docs/tabs-rebuild-impeccable-plan.md Phase 6
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const result = await proxyToFastAPI<Record<string, unknown>>(
      '/api/v1/rate-constant/marcus',
      { method: 'POST', body: JSON.stringify(body) },
    );

    try {
      await prisma.reaction.create({
        data: {
          userId: session.user.id,
          name: 'Marcus theory run',
          reactionType: 'BIMOLECULAR',
          energyType: 'En',
          status: 'COMPLETED',
        },
      });
    } catch (e) {
      console.warn('Failed to persist Marcus history row:', e);
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Marcus compute failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
