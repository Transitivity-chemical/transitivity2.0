import { NextRequest } from 'next/server';
import { proxyToFastAPI } from '@/lib/fastapi-proxy';
import { prisma } from '@/lib/prisma';
import { shouldBeAuthorized, ClientError, successResponse, errorResponse } from '@/lib/api-utils';
import type { MDMethod } from '@prisma/client';

/**
 * Phase 14B of megaplan: proxy to FastAPI /api/v1/md/generate-multi.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await shouldBeAuthorized();
    const body = (await request.json()) as { dynamicsType?: string; name?: string };
    const result = await proxyToFastAPI('/api/v1/md/generate-multi', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    // Persist an MDSimulation row so multi runs appear in history.
    try {
      await prisma.mDSimulation.create({
        data: {
          userId: session.user!.id!,
          name: body.name || `Multi-input ${body.dynamicsType ?? 'MD'}`,
          mdMethod: (body.dynamicsType || 'CPMD') as MDMethod,
          status: 'COMPLETED',
        },
      });
    } catch (e) {
      console.warn('Failed to persist MD multi history row:', e);
    }

    return successResponse(result);
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
}
