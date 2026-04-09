import { prisma } from '@/lib/prisma';
import { shouldBeAuthorized, ClientError, successResponse, errorResponse } from '@/lib/api-utils';

/**
 * Phase 13 of megaplan: list user's fitting jobs.
 */
export async function GET() {
  try {
    const session = await shouldBeAuthorized();
    const jobs = await prisma.fittingJob.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { result: true },
    });
    return successResponse({ jobs });
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
}
