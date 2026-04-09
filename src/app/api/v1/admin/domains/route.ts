import { z } from 'zod';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shouldBeAdmin, ClientError, successResponse, errorResponse } from '@/lib/api-utils';

/**
 * Phase 7 of megaplan: admin email-domain CRUD (list + create).
 */

const createSchema = z
  .object({
    domain: z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, 'Invalid domain format'),
    institution: z.string().min(1).max(200),
    country: z.string().default('BR'),
    defaultPlan: z.enum(['STUDENT', 'PROFESSIONAL', 'ENTERPRISE']).default('STUDENT'),
    isVerified: z.boolean().default(true),
  })
  .strict();

export async function GET() {
  try {
    await shouldBeAdmin();
    const domains = await prisma.institutionalDomain.findMany({
      orderBy: { domain: 'asc' },
    });
    return successResponse({ domains });
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await shouldBeAdmin();
    const body = await request.json();
    const data = createSchema.parse(body);

    const existing = await prisma.institutionalDomain.findUnique({
      where: { domain: data.domain.toLowerCase() },
    });
    if (existing) throw new ClientError('Domain already registered', 409);

    const created = await prisma.institutionalDomain.create({
      data: { ...data, domain: data.domain.toLowerCase() },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_DOMAIN_CREATED',
        entityType: 'InstitutionalDomain',
        entityId: created.id,
        metadata: { domain: created.domain, defaultPlan: created.defaultPlan },
      },
    });

    return successResponse({ domain: created }, 201);
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    if (err instanceof z.ZodError) return errorResponse(`Validation: ${err.message}`, 422);
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
}
