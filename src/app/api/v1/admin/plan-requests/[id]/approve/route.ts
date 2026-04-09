import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shouldBeAdmin, ClientError, successResponse, errorResponse } from '@/lib/api-utils';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * FIX-16: approve a plan change request.
 *
 * - Sets request.status = APPROVED
 * - Updates user.plan = targetPlan
 * - Refills credits to the new plan's maxCredits (or null = unlimited)
 * - Notifies the user
 * - Audit logs
 */
export async function POST(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await shouldBeAdmin();
    const { id } = await ctx.params;

    const request = await prisma.planChangeRequest.findUnique({
      where: { id },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
    if (!request) throw new ClientError('Solicitação não encontrada', 404);
    if (request.status !== 'PENDING') {
      throw new ClientError('Solicitação já foi processada', 400);
    }

    const planConfig = await prisma.planConfig.findUnique({
      where: { plan: request.targetPlan },
    });
    const newCredits = planConfig?.maxCredits ?? 0;

    await prisma.$transaction([
      prisma.planChangeRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          resolvedAt: new Date(),
          resolvedById: session.user.id,
        },
      }),
      prisma.user.update({
        where: { id: request.userId },
        data: { plan: request.targetPlan, credits: newCredits },
      }),
      prisma.notification.create({
        data: {
          userId: request.userId,
          type: 'PLAN_CHANGED',
          title: 'Solicitação de plano aprovada',
          message: `Você agora está no plano ${request.targetPlan}. ${planConfig?.maxCredits ?? 'Créditos ilimitados'}${planConfig?.maxCredits ? ' créditos' : ''}.`,
          link: '/plans',
          metadata: { requestId: id, newPlan: request.targetPlan },
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'PLAN_REQUEST_APPROVED',
          entityType: 'PlanChangeRequest',
          entityId: id,
          metadata: { userId: request.userId, newPlan: request.targetPlan },
        },
      }),
    ]);

    return successResponse({ ok: true });
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
}
