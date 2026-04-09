import { z } from 'zod';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shouldBeAdmin, ClientError, successResponse, errorResponse } from '@/lib/api-utils';

const patchSchema = z
  .object({
    institution: z.string().min(1).max(200).optional(),
    defaultPlan: z.enum(['STUDENT', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
    isVerified: z.boolean().optional(),
  })
  .strict();

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    const session = await shouldBeAdmin();
    const { id } = await ctx.params;
    const body = await request.json();
    const data = patchSchema.parse(body);

    const updated = await prisma.institutionalDomain.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_DOMAIN_UPDATED',
        entityType: 'InstitutionalDomain',
        entityId: id,
        metadata: { changes: data },
      },
    });

    return successResponse({ domain: updated });
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

    const existing = await prisma.institutionalDomain.findUnique({ where: { id } });
    if (!existing) throw new ClientError('Domain not found', 404);

    await prisma.institutionalDomain.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_DOMAIN_DELETED',
        entityType: 'InstitutionalDomain',
        entityId: id,
        metadata: { domain: existing.domain },
      },
    });

    return successResponse({ ok: true });
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
}
