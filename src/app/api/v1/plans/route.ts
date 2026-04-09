import { prisma } from '@/lib/prisma';
import { shouldBeAuthorized, ClientError, successResponse, errorResponse } from '@/lib/api-utils';

/**
 * Phase 8 of megaplan: list plan configurations.
 */
export async function GET() {
  try {
    await shouldBeAuthorized();
    const plans = await prisma.planConfig.findMany({ orderBy: { plan: 'asc' } });
    return successResponse({ plans });
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
}
