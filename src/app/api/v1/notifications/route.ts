import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shouldBeAuthorized, ClientError, successResponse, errorResponse } from '@/lib/api-utils';

/**
 * FIX-14 of post-megaplan audit: list notifications.
 *
 * GET /api/v1/notifications?limit=20&onlyUnread=true
 *   Returns { notifications, unreadCount }
 *
 * Pattern adapted from docs/audit-campus-notifications.md §3 + §4.
 * Header bell polls with limit=1 every 30s just for the unreadCount.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await shouldBeAuthorized();
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get('limit') || '20'), 100);
    const onlyUnread = url.searchParams.get('onlyUnread') === 'true';

    const where = {
      userId: session.user.id,
      ...(onlyUnread ? { isRead: false } : {}),
    };

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: session.user.id, isRead: false },
      }),
    ]);

    return successResponse({ notifications, unreadCount });
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
}
