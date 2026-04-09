import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shouldBeAdmin, ClientError, successResponse, errorResponse } from '@/lib/api-utils';

/**
 * FIX-16 of post-megaplan audit: list plan change requests for admin.
 *
 * GET /api/v1/admin/plan-requests?status=PENDING&limit=50
 */
export async function GET(request: NextRequest) {
  try {
    await shouldBeAdmin();
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'PENDING';
    const limit = Math.min(Number(url.searchParams.get('limit') || '50'), 100);

    const requests = await prisma.planChangeRequest.findMany({
      where: status === 'all' ? {} : { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, email: true, fullName: true, plan: true, credits: true } },
        resolvedBy: { select: { id: true, email: true, fullName: true } },
      },
    });

    return successResponse({ requests });
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
}
