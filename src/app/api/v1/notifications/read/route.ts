import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shouldBeAuthorized, ClientError, successResponse, errorResponse } from '@/lib/api-utils';

/**
 * Mark notifications as read.
 *
 * POST /api/v1/notifications/read
 *   Body: { notificationIds: string[] } | { markAll: true }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await shouldBeAuthorized();
    const body = await request.json().catch(() => ({}));

    if (body?.markAll) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      });
      return successResponse({ ok: true });
    }

    if (Array.isArray(body?.notificationIds) && body.notificationIds.length > 0) {
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          id: { in: body.notificationIds },
        },
        data: { isRead: true },
      });
      return successResponse({ ok: true });
    }

    return errorResponse('Provide notificationIds[] or markAll:true', 400);
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
}
