import { z } from 'zod';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shouldBeAuthorized, ClientError, successResponse, errorResponse } from '@/lib/api-utils';

/**
 * FIX-16 of post-megaplan audit: real plan-change request flow.
 *
 * Creates a PlanChangeRequest row + admin notifications linking to the
 * Admin Users page where they can accept/reject from the dashboard.
 */
const bodySchema = z
  .object({
    targetPlan: z.enum(['STUDENT', 'PROFESSIONAL', 'ENTERPRISE']),
    reason: z.string().max(500).optional(),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    const session = await shouldBeAuthorized();
    const body = await request.json();
    const { targetPlan, reason } = bodySchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, fullName: true, email: true, plan: true },
    });
    if (!user) throw new ClientError('User not found', 404);

    if (user.plan === targetPlan) {
      throw new ClientError('Você já está neste plano', 400);
    }

    // Reject if user already has a pending request for the same target
    const existing = await prisma.planChangeRequest.findFirst({
      where: { userId: user.id, status: 'PENDING' },
    });
    if (existing) {
      throw new ClientError('Você já tem uma solicitação pendente', 400);
    }

    const req = await prisma.planChangeRequest.create({
      data: {
        userId: user.id,
        currentPlan: user.plan,
        targetPlan,
        reason,
        status: 'PENDING',
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: 'PLAN_UPGRADE_REQUEST' as const,
          title: 'Nova solicitação de mudança de plano',
          message: `${user.fullName} (${user.email}) quer mudar de ${user.plan ?? '—'} para ${targetPlan}.`,
          link: '/admin/users',
          metadata: { requestId: req.id, userId: user.id, currentPlan: user.plan, targetPlan },
        })),
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PLAN_CHANGE_REQUESTED',
        entityType: 'PlanChangeRequest',
        entityId: req.id,
        metadata: { currentPlan: user.plan, targetPlan },
      },
    });

    return successResponse({ ok: true, requestId: req.id });
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    if (err instanceof z.ZodError) return errorResponse(`Validation: ${err.message}`, 422);
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
}
