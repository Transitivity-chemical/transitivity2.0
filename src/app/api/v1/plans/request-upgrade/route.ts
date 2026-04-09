import { z } from 'zod';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shouldBeAuthorized, ClientError, successResponse, errorResponse } from '@/lib/api-utils';

/**
 * Phase 8 of megaplan: user requests a plan upgrade.
 *
 * Creates a Notification for all admins. No payment yet — admin manually
 * promotes the user via the Admin Users page.
 */
const bodySchema = z
  .object({
    targetPlan: z.enum(['STUDENT', 'PROFESSIONAL', 'ENTERPRISE']),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    const session = await shouldBeAuthorized();
    const body = await request.json();
    const { targetPlan } = bodySchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, fullName: true, email: true, plan: true },
    });

    if (!user) throw new ClientError('User not found', 404);

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: 'SYSTEM' as const,
          title: 'Solicitação de upgrade de plano',
          message: `${user.fullName} (${user.email}) solicitou upgrade do plano ${user.plan ?? 'sem plano'} para ${targetPlan}.`,
          metadata: { requesterId: user.id, currentPlan: user.plan, targetPlan },
        })),
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PLAN_UPGRADE_REQUESTED',
        entityType: 'User',
        entityId: user.id,
        metadata: { currentPlan: user.plan, targetPlan },
      },
    });

    return successResponse({ ok: true });
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    if (err instanceof z.ZodError) return errorResponse(`Validation: ${err.message}`, 422);
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
}
