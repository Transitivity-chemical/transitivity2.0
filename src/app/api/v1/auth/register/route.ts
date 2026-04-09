import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validators/auth';
import { validateEmailDomain } from '@/lib/validators/email-domain';
import { asyncWrapper, ClientError, successResponse, parseRequestJson } from '@/lib/api-utils';

/**
 * Self-registration with institutional email domain check.
 *
 * Phase 4 of megaplan.
 *
 * Allowed domain → assign defaultPlan + planConfig.maxCredits, isInstitutional=true
 * Disallowed domain → create user with pendingApproval=true, plan=null, credits=0
 *
 * Reference: docs/transitivity-overhaul-plan.md Phase 4
 *           docs/audit-frontend-current.md §13
 */
export const POST = asyncWrapper(async (request: Request) => {
  const data = await parseRequestJson(request, registerSchema);

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new ClientError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const { allowed, domain } = await validateEmailDomain(data.email);

  let plan: 'STUDENT' | 'PROFESSIONAL' | 'ENTERPRISE' | null = null;
  let credits = 0;
  let pendingApproval = true;
  let isInstitutional = false;
  let institution: string | null = null;

  if (allowed && domain) {
    plan = domain.defaultPlan;
    pendingApproval = false;
    isInstitutional = true;
    institution = domain.institution;

    const planConfig = await prisma.planConfig.findUnique({
      where: { plan: domain.defaultPlan },
    });
    credits = planConfig?.maxCredits ?? 0;
  }

  const user = await prisma.user.create({
    data: {
      email: data.email,
      fullName: data.fullName,
      passwordHash,
      role: 'USER',
      plan,
      credits,
      pendingApproval,
      isInstitutional,
      institution,
      mustChangePassword: false,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      plan: true,
      pendingApproval: true,
      institution: true,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: pendingApproval ? 'USER_REGISTERED_PENDING' : 'USER_REGISTERED_AUTOAPPROVED',
      entityType: 'User',
      entityId: user.id,
      metadata: { email: data.email, plan, institution },
    },
  });

  // Notify admins on every registration
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true },
  });
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: 'USER_REGISTERED' as const,
        title: pendingApproval ? 'Novo registro aguardando aprovação' : 'Novo usuário registrado',
        message: pendingApproval
          ? `${data.fullName} (${data.email}) se registrou com um domínio não autorizado.`
          : `${data.fullName} (${data.email}) entrou no plano ${plan ?? '—'}.`,
        link: '/admin/users',
        metadata: { newUserId: user.id, email: data.email, pendingApproval },
      })),
    });
  }

  // Welcome notification for the user themselves
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: pendingApproval ? 'SYSTEM' : 'WELCOME',
      title: pendingApproval ? 'Conta aguardando aprovação' : 'Bem-vindo ao Transitivity 2.0!',
      message: pendingApproval
        ? 'Um administrador irá revisar sua conta em breve.'
        : `Sua conta foi criada no plano ${plan}. Você tem ${credits} créditos para começar.`,
      link: pendingApproval ? null : '/dashboard',
    },
  });

  return successResponse({ user, pendingApproval }, 201);
});
