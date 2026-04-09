import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shouldBeAdmin, ClientError, successResponse, errorResponse } from '@/lib/api-utils';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await shouldBeAdmin();
    const { id } = await ctx.params;

    const request = await prisma.planChangeRequest.findUnique({
      where: { id },
    });
    if (!request) throw new ClientError('Solicitação não encontrada', 404);
    if (request.status !== 'PENDING') {
      throw new ClientError('Solicitação já foi processada', 400);
    }

    await prisma.$transaction([
      prisma.planChangeRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          resolvedAt: new Date(),
          resolvedById: session.user.id,
        },
      }),
      prisma.notification.create({
        data: {
          userId: request.userId,
          type: 'SYSTEM',
          title: 'Solicitação de plano rejeitada',
          message: `Sua solicitação para mudar para ${request.targetPlan} foi rejeitada. Entre em contato para mais detalhes.`,
          link: '/plans',
          metadata: { requestId: id },
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'PLAN_REQUEST_REJECTED',
          entityType: 'PlanChangeRequest',
          entityId: id,
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
