import bcrypt from 'bcrypt';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shouldBeAdmin, ClientError, successResponse, errorResponse } from '@/lib/api-utils';
import { generateTempPassword } from '@/lib/temp-password';
import { sendInviteEmail } from '@/lib/email';

/**
 * Phase 6 of megaplan: admin Users CRUD list + create.
 *
 * GET: paginated list with filters
 * POST: create user with auto-generated temp password, auto-email, return temp pwd to admin
 *
 * Reference: docs/transitivity-overhaul-plan.md Phase 6
 *           docs/audit-questionpunk.md §3 (admin user-management patterns)
 */

const createSchema = z
  .object({
    email: z.string().email().toLowerCase(),
    fullName: z.string().min(1).max(200),
    plan: z.enum(['STUDENT', 'PROFESSIONAL', 'ENTERPRISE']),
    role: z.enum(['ADMIN', 'RESEARCHER', 'VIEWER']).default('RESEARCHER'),
  })
  .strict();

export async function GET(request: NextRequest) {
  try {
    const session = await shouldBeAdmin();
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.trim() || '';
    const planFilter = url.searchParams.get('plan');
    const roleFilter = url.searchParams.get('role');
    const statusFilter = url.searchParams.get('status'); // 'active' | 'pending' | 'inactive'
    const page = Number(url.searchParams.get('page') ?? '1');
    const pageSize = 50;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (planFilter && ['STUDENT', 'PROFESSIONAL', 'ENTERPRISE'].includes(planFilter)) {
      where.plan = planFilter;
    }
    if (roleFilter && ['ADMIN', 'RESEARCHER', 'VIEWER'].includes(roleFilter)) {
      where.role = roleFilter;
    }
    if (statusFilter === 'pending') where.pendingApproval = true;
    if (statusFilter === 'inactive') where.isActive = false;
    if (statusFilter === 'active') {
      where.isActive = true;
      where.pendingApproval = false;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          plan: true,
          credits: true,
          isActive: true,
          pendingApproval: true,
          mustChangePassword: true,
          institution: true,
          isInstitutional: true,
          lastLoginAt: true,
          createdAt: true,
          invitedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return successResponse({
      users,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      adminId: session.user.id,
    });
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

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ClientError('Email already registered', 409);

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const planConfig = await prisma.planConfig.findUnique({ where: { plan: data.plan } });
    const credits = planConfig?.maxCredits ?? 0;

    const user = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        passwordHash,
        role: data.role,
        plan: data.plan,
        credits,
        mustChangePassword: true,
        pendingApproval: false,
        invitedAt: new Date(),
        invitedById: session.user.id,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        plan: true,
        credits: true,
      },
    });

    // Auto-send email
    const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/pt-BR/login`;
    const emailResult = await sendInviteEmail({
      to: data.email,
      name: data.fullName,
      tempPassword,
      loginUrl,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_CREATED_USER',
        entityType: 'User',
        entityId: user.id,
        metadata: {
          email: data.email,
          plan: data.plan,
          role: data.role,
          emailSent: emailResult.sent,
          emailProvider: emailResult.provider,
        },
      },
    });

    return successResponse(
      {
        user,
        tempPassword,
        email: { sent: emailResult.sent, provider: emailResult.provider, error: emailResult.error },
      },
      201,
    );
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    if (err instanceof z.ZodError) return errorResponse(`Validation: ${err.message}`, 422);
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
}
