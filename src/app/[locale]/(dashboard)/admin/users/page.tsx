import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdminRole } from '@/lib/access';
import { AdminUsersClient } from '@/components/admin/AdminUsersClient';
import type { Plan } from '@prisma/client';

type AdminCopy = ReturnType<typeof getAdminCopy>;

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const adminRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!adminRecord || !isAdminRole(adminRecord.role)) {
    redirect(`/${locale}/dashboard`);
  }

  const [
    totalUsers,
    activeUsers,
    pendingApprovalCount,
    institutionalCount,
    domainCount,
    planRequestsCount,
    pendingApprovalsFeed,
    planRequestsPreview,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, isActive: true } }),
    prisma.user.count({ where: { deletedAt: null, pendingApproval: true } }),
    prisma.user.count({ where: { deletedAt: null, isInstitutional: true } }),
    prisma.institutionalDomain.count(),
    prisma.planChangeRequest.count({ where: { status: 'PENDING' } }),
    prisma.user.findMany({
      where: { deletedAt: null, pendingApproval: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { id: true, fullName: true, institution: true, createdAt: true, plan: true },
    }),
    prisma.planChangeRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: {
        id: true,
        targetPlan: true,
        currentPlan: true,
        createdAt: true,
        reason: true,
        user: { select: { fullName: true, institution: true } },
      },
    }),
  ]);

  const numberFormatter = new Intl.NumberFormat(locale);
  const copy = getAdminCopy(locale);

  const stats: Array<{ label: string; value: string }> = [
    {
      label: copy.stats.active,
      value: numberFormatter.format(activeUsers),
    },
    {
      label: copy.stats.pending,
      value: numberFormatter.format(pendingApprovalCount),
    },
    {
      label: copy.stats.institutional,
      value: numberFormatter.format(institutionalCount),
    },
    {
      label: copy.stats.requests,
      value: numberFormatter.format(planRequestsCount),
    },
  ];

  return (
    <div className="px-6 pb-10 pt-6 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="rounded-lg border border-slate-200/70 bg-white/95 shadow-sm px-6 py-6 text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{copy.heroTitle}</h1>
              <p className="text-sm text-muted-foreground">{copy.heroSubtitle}</p>
            </div>
            <p className="text-xs font-medium text-muted-foreground">{copy.heroBadge(numberFormatter.format(totalUsers))}</p>
          </div>

          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-slate-200/70 bg-white/80 shadow-sm px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                  {stat.label}
                </dt>
                <dd className="mt-1 font-mono text-2xl font-semibold text-slate-900 dark:text-white">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-slate-200/70 bg-white/95 shadow-sm p-5 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{copy.planQueueTitle}</h2>
                <p className="text-sm text-muted-foreground">{copy.planQueueSubtitle}</p>
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {planRequestsCount > 0 ? copy.planQueueBusy(planRequestsCount) : copy.planQueueIdle}
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {planRequestsPreview.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-200/70 px-4 py-5 text-sm text-muted-foreground shadow-sm dark:border-slate-800">
                  {copy.planQueueEmpty}
                </p>
              )}

              {planRequestsPreview.map((req) => (
                <div
                  key={req.id}
                  className="rounded-lg border border-slate-200/70 bg-white/80 shadow-sm px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white">
                    <span>{req.user.fullName}</span>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(req.createdAt, locale)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {copy.planQueueDelta(planLabel(req.currentPlan, locale), planLabel(req.targetPlan, locale))}
                  </p>
                  {req.user.institution && (
                    <p className="text-[11px] text-muted-foreground">{req.user.institution}</p>
                  )}
                  {req.reason && (
                    <p className="mt-2 rounded-md bg-slate-900/5 px-3 py-2 text-[11px] italic text-muted-foreground dark:bg-white/10">
                      &ldquo;{req.reason}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{copy.planQueueFootnote}</p>
          </section>

          <section className="rounded-lg border border-slate-200/70 bg-white/95 shadow-sm p-5 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{copy.approvalsTitle}</h2>
                <p className="text-sm text-muted-foreground">{copy.approvalsSubtitle}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {pendingApprovalsFeed.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-200/70 px-4 py-5 text-sm text-muted-foreground shadow-sm dark:border-slate-800">
                  {copy.approvalsEmpty}
                </p>
              )}

              {pendingApprovalsFeed.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200/70 bg-white/80 shadow-sm px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex size-10 items-center justify-center rounded-md bg-slate-900/90 text-[13px] font-semibold uppercase tracking-tight text-white dark:bg-slate-700">
                    {getInitials(user.fullName)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.institution ?? copy.noInstitution}</p>
                  </div>
                  <div className="text-right text-[11px] text-muted-foreground">
                    <p>{planLabel(user.plan, locale)}</p>
                    <p>{formatRelativeTime(user.createdAt, locale)}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{copy.approvalsFootnote}</p>
          </section>
        </div>

        <section className="rounded-lg border border-slate-200/70 bg-white/95 shadow-sm p-5 dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4">
            <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{copy.tableTitle}</h3>
            <p className="text-sm text-muted-foreground">{copy.tableSubtitle}</p>
          </div>
          <div className="rounded-lg border border-slate-200/70 bg-white/90 shadow-sm p-2 dark:border-slate-800 dark:bg-slate-900">
            <AdminUsersClient locale={locale} />
          </div>
        </section>
      </div>
    </div>
  );
}

const PLAN_LABELS = {
  'pt-BR': {
    STUDENT: 'Estudante',
    PROFESSIONAL: 'Profissional',
    ENTERPRISE: 'Empresarial',
    none: 'Sem plano',
  },
  default: {
    STUDENT: 'Student',
    PROFESSIONAL: 'Professional',
    ENTERPRISE: 'Enterprise',
    none: 'No plan',
  },
} as const;

const RELATIVE_TIME_UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'day', ms: 86_400_000 },
  { unit: 'hour', ms: 3_600_000 },
  { unit: 'minute', ms: 60_000 },
  { unit: 'second', ms: 1_000 },
];

function planLabel(plan: Plan | null, locale: string) {
  const dict = locale === 'pt-BR' ? PLAN_LABELS['pt-BR'] : PLAN_LABELS.default;
  if (!plan) return dict.none;
  return dict[plan];
}

function formatRelativeTime(date: Date, locale: string) {
  const diff = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const { unit, ms } of RELATIVE_TIME_UNITS) {
    if (Math.abs(diff) >= ms || unit === 'second') {
      return rtf.format(Math.round(diff / ms), unit);
    }
  }
  return '';
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function getAdminCopy(locale: string) {
  if (locale === 'pt-BR') {
    return {
      heroTitle: 'Orquestração de acesso',
      heroSubtitle: 'Panorama rápido de convites, créditos e solicitações de upgrade.',
      heroBadge: (total: string) => `${total} contas registradas`,
      stats: {
        active: 'Usuários ativos',
        pending: 'Aprovações pendentes',
        institutional: 'Institucionais',
        requests: 'Solicitações de plano',
      },
      planQueueTitle: 'Fila de upgrades',
      planQueueSubtitle: 'Solicitações aguardando uma decisão.',
      planQueueFootnote: 'A fila sincroniza com /api/v1/admin/plan-requests em tempo real.',
      planQueueEmpty: 'Nenhum pedido pendente — os usuários verão a confirmação instantaneamente.',
      planQueueIdle: 'Sem filas',
      planQueueBusy: (count: number) => `${count} aguardando`,
      planQueueDelta: (current: string, target: string) => `De ${current} para ${target}`,
      approvalsTitle: 'Novos pesquisadores',
      approvalsSubtitle: 'Convites aguardando desbloqueio.',
      approvalsEmpty: 'Nenhum convite preso. Tudo revisado.',
      approvalsFootnote: 'Use o módulo abaixo para aprovar, editar e reenviar convites.',
      noInstitution: 'Sem instituição',
      tableTitle: 'Painel completo',
      tableSubtitle: 'Filtro avançado, importações institucionais e gestão granular vivem aqui.',
      noPlan: 'Sem plano',
    };
  }

  return {
    heroTitle: 'Access orchestration',
    heroSubtitle: 'Executive pulse on invites, credits, and pending plan deltas.',
    heroBadge: (total: string) => `${total} total accounts`,
    stats: {
      active: 'Active users',
      pending: 'Awaiting approval',
      institutional: 'Institutional',
      requests: 'Plan requests',
    },
    planQueueTitle: 'Upgrade queue',
    planQueueSubtitle: 'Requests waiting on an admin.',
    planQueueFootnote: 'Feeds directly from /api/v1/admin/plan-requests.',
    planQueueEmpty: 'No pending requests — anyone upgrading will be cleared instantly.',
    planQueueIdle: 'Queue clear',
    planQueueBusy: (count: number) => `${count} awaiting`,
    planQueueDelta: (current: string, target: string) => `From ${current} to ${target}`,
    approvalsTitle: 'Pending approvals',
    approvalsSubtitle: 'Latest researchers waiting for seats.',
    approvalsEmpty: 'Invite inbox is clean.',
    approvalsFootnote: 'Full moderation lives below with domain controls and filters.',
    noInstitution: 'No institution',
    tableTitle: 'Admin control surface',
    tableSubtitle: 'Advanced filters, institutional imports, and invite flows run here.',
    noPlan: 'No plan',
  };
}
