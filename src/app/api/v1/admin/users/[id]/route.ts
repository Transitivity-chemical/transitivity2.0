import { z } from 'zod';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shouldBeAdmin, ClientError, successResponse, errorResponse } from '@/lib/api-utils';

/**
 * Phase 6 of megaplan: admin user CRUD per-id (PATCH/DELETE).
 */

const patchSchema = z
  .object({
    fullName: z.string().min(1).max(200).optional(),
    role: z.enum(['ADMIN', 'RESEARCHER', 'VIEWER']).optional(),
    plan: z.enum(['STUDENT', 'PROFESSIONAL', 'ENTERPRISE']).nullable().optional(),
    credits: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
    pendingApproval: z.boolean().optional(),
  })
  .strict();

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    const session = await shouldBeAdmin();
    const { id } = await ctx.params;
    const body = await request.json();
    const data = patchSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new ClientError('User not found', 404);

    // If plan changes and not explicitly setting credits, refill to plan cap
    let nextCredits = data.credits;
    if (data.plan && data.plan !== existing.plan && data.credits === undefined) {
      const planConfig = await prisma.planConfig.findUnique({ where: { plan: data.plan } });
      nextCredits = planConfig?.maxCredits ?? Number(existing.credits);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.plan !== undefined && { plan: data.plan }),
        ...(nextCredits !== undefined && { credits: nextCredits }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.pendingApproval !== undefined && { pendingApproval: data.pendingApproval }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        plan: true,
        credits: true,
        isActive: true,
        pendingApproval: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_UPDATED_USER',
        entityType: 'User',
        entityId: id,
        metadata: { changes: data },
      },
    });

    return successResponse({ user: updated });
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    if (err instanceof z.ZodError) return errorResponse(`Validation: ${err.message}`, 422);
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await shouldBeAdmin();
    const { id } = await ctx.params;

    if (id === session.user.id) {
      throw new ClientError('Cannot deactivate your own account', 400);
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_DEACTIVATED_USER',
        entityType: 'User',
        entityId: id,
      },
    });

    return successResponse({ ok: true });
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
}
