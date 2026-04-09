import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shouldBeAuthorized, ClientError, successResponse, errorResponse } from '@/lib/api-utils';

/**
 * Phase 13 of megaplan: load/delete a single fitting job (and its result).
 */
type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await shouldBeAuthorized();
    const { jobId } = await ctx.params;
    const job = await prisma.fittingJob.findFirst({
      where: { id: jobId, userId: session.user.id },
      include: { result: true },
    });
    if (!job) throw new ClientError('Fitting job not found', 404);
    return successResponse({ job });
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await shouldBeAuthorized();
    const { jobId } = await ctx.params;
    const existing = await prisma.fittingJob.findFirst({
      where: { id: jobId, userId: session.user.id },
    });
    if (!existing) throw new ClientError('Fitting job not found', 404);
    await prisma.fittingJob.delete({ where: { id: jobId } });
    return successResponse({ ok: true });
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
}
