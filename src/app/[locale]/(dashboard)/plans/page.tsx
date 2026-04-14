import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { PlansClient } from '@/components/plans/PlansClient';
import type { Plan, PlanRequestStatus } from '@prisma/client';

const PLAN_ORDER: Plan[] = ['STUDENT', 'PROFESSIONAL', 'ENTERPRISE'];

const PLAN_COLORS: Record<Plan, string> = {
  STUDENT: 'oklch(0.78 0.05 230)',
  PROFESSIONAL: 'oklch(0.72 0.05 250)',
  ENTERPRISE: 'oklch(0.66 0.05 280)',
};

type PlansCopy = ReturnType<typeof getPlansCopy>;

export default async function PlansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const [planConfigsRaw, currentUser, planRequestsCount, domainCount, latestRequests, distributionCounts] = await Promise.all([
    prisma.planConfig.findMany({ orderBy: { plan: 'asc' } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true, credits: true } }),
    prisma.planChangeRequest.count({ where: { status: 'PENDING' } }),
    prisma.institutionalDomain.count(),
    prisma.planChangeRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        targetPlan: true,
        currentPlan: true,
        status: true,
        createdAt: true,
        reason: true,
        user: { select: { fullName: true, institution: true } },
      },
    }),
    Promise.all(PLAN_ORDER.map((plan) => prisma.user.count({ where: { plan } }))),
  ]);

  const planConfigs = planConfigsRaw.map((p) => ({
    plan: p.plan,
    maxCredits: p.maxCredits,
    monthlyCredits: p.monthlyCredits,
    label: p.label,
    labelEn: p.labelEn,
    description: p.description,
    descriptionEn: p.descriptionEn,
  }));

  const credits = Number(currentUser?.credits ?? 0);
  const currentPlan = currentUser?.plan ?? null;

  const planDistribution = PLAN_ORDER.map((plan, index) => ({
    plan,
    count: distributionCounts[index],
  }));
  const totalSeats = planDistribution.reduce((sum, item) => sum + item.count, 0);

  const numberFormatter = new Intl.NumberFormat(locale);
  const copy = getPlansCopy(locale);

  const highlightStats: Array<{ label: string; value: string }> = [
    {
      label: copy.stats.currentPlan,
      value: planLabel(currentPlan, locale),
    },
    {
      label: copy.stats.availableCredits,
      value: `${numberFormatter.format(credits)} ${copy.creditsLabel}`,
    },
    {
      label: copy.stats.pendingRequests,
      value: numberFormatter.format(planRequestsCount),
    },
    {
      label: copy.stats.verifiedDomains,
      value: numberFormatter.format(domainCount),
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
            <p className="text-xs font-medium text-muted-foreground">
              {copy.heroBadge(planLabel(currentPlan, locale))}
            </p>
          </div>

          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            {highlightStats.map((stat) => (
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

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <section className="rounded-lg border border-slate-200/70 bg-white/95 shadow-sm p-5 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4">
              <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{copy.tableTitle}</h3>
              <p className="text-sm text-muted-foreground">{copy.tableSubtitle}</p>
            </div>
            <div className="rounded-lg border border-slate-200/70 bg-white/90 shadow-sm p-2 dark:border-slate-800 dark:bg-slate-900">
              <PlansClient
                locale={locale}
                planConfigs={planConfigs}
                currentPlan={currentPlan}
                credits={credits}
              />
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            <section className="rounded-lg border border-slate-200/70 bg-white/95 shadow-sm p-5 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{copy.distributionTitle}</h4>
                  <p className="text-xs text-muted-foreground">{copy.distributionSubtitle(totalSeats)}</p>
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  {copy.distributionBadge(numberFormatter.format(totalSeats))}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {planDistribution.map(({ plan, count }) => {
                  const share = totalSeats === 0 ? 0 : Math.round((count / totalSeats) * 100);
                  return (
                    <div
                      key={plan}
                      className="rounded-lg border border-slate-200/70 bg-white/80 shadow-sm p-3 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white">
                        <span>{planLabel(plan, locale)}</span>
                        <span>{share}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-sm bg-slate-900/10 dark:bg-white/10">
                        <span
                          className="block h-full rounded-sm"
                          style={{
                            width: `${share}%`,
                            backgroundColor: PLAN_COLORS[plan],
                          }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {numberFormatter.format(count)} {copy.peopleSuffix}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200/70 bg-white/95 shadow-sm p-5 dark:border-slate-800 dark:bg-slate-950">
              <div>
                <h4 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{copy.timelineTitle}</h4>
                <p className="text-xs text-muted-foreground">{copy.timelineSubtitle}</p>
              </div>

              <div className="mt-4 space-y-3">
                {latestRequests.length === 0 && (
                  <p className="rounded-lg border border-dashed border-slate-200/70 px-4 py-5 text-sm text-muted-foreground shadow-sm dark:border-slate-800">
                    {copy.timelineEmpty}
                  </p>
                )}

                {latestRequests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-lg border border-slate-200/70 bg-white/80 shadow-sm px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{req.user.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {planLabel(req.currentPlan, locale)} → {planLabel(req.targetPlan, locale)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${STATUS_BADGES[req.status]}`}
                      >
                        {copy.statusLabel[req.status]}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{req.user.institution ?? copy.noInstitution}</span>
                      <span>{formatRelativeTime(req.createdAt, locale)}</span>
                    </div>
                    {req.reason && (
                      <p className="mt-2 text-[11px] italic text-muted-foreground">&ldquo;{req.reason}&rdquo;</p>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{copy.timelineFootnote}</p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

const STATUS_BADGES: Record<PlanRequestStatus, string> = {
  PENDING: 'border border-amber-500/30 bg-amber-500/15 text-amber-500',
  APPROVED: 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
  REJECTED: 'border border-rose-500/30 bg-rose-500/15 text-rose-400',
};

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

function getPlansCopy(locale: string) {
  if (locale === 'pt-BR') {
    return {
      heroTitle: 'Planos & créditos',
      heroSubtitle: 'Controle preciso de limites, upgrades e domínios verificados.',
      heroBadge: (plan: string) => `Plano atual: ${plan}`,
      stats: {
        currentPlan: 'Plano atual',
        availableCredits: 'Créditos disponíveis',
        pendingRequests: 'Solicitações em fila',
        verifiedDomains: 'Domínios verificados',
      },
      creditsLabel: 'créditos',
      tableTitle: 'Escolha um plano',
      tableSubtitle: 'Comparação detalhada com recursos e limites.',
      distributionTitle: 'Ocupação por plano',
      distributionSubtitle: (total: number) => (total === 0 ? 'Nenhum usuário com plano atribuído.' : `${total} usuários com plano.`),
      distributionBadge: (total: string) => `${total} contas`,
      peopleSuffix: 'usuários',
      distributionTitleSuffix: '',
      timelineTitle: 'Histórico recente',
      timelineSubtitle: 'Solicitações enviadas pela equipe.',
      timelineEmpty: 'Nenhuma solicitação recente.',
      timelineFootnote: 'Logs sincronizados com /api/v1/plans/request-upgrade.',
      statusLabel: {
        PENDING: 'Pendente',
        APPROVED: 'Aprovado',
        REJECTED: 'Rejeitado',
      } as Record<PlanRequestStatus, string>,
      noInstitution: 'Sem instituição',
    };
  }

  return {
    heroTitle: 'Plans & credits',
    heroSubtitle: 'Mac-first surface for comparing usage, seats, and upgrade demand.',
    heroBadge: (plan: string) => `Current plan: ${plan}`,
    stats: {
      currentPlan: 'Current plan',
      availableCredits: 'Available credits',
      pendingRequests: 'Requests in queue',
      verifiedDomains: 'Verified domains',
    },
    creditsLabel: 'credits',
    tableTitle: 'Pick your runway',
    tableSubtitle: 'Every tier with features, credit ceilings, and upgrade CTAs.',
    distributionTitle: 'Seats by plan',
    distributionSubtitle: (total: number) => (total === 0 ? 'No users assigned to a plan yet.' : `${total} users mapped to a plan.`),
    distributionBadge: (total: string) => `${total} seats`,
    peopleSuffix: 'users',
    timelineTitle: 'Recent requests',
    timelineSubtitle: 'Latest upgrade / downgrade intents.',
    timelineEmpty: 'No recent requests.',
    timelineFootnote: 'Mirrors /api/v1/plans/request-upgrade in real time.',
    statusLabel: {
      PENDING: 'Pending',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
    } as Record<PlanRequestStatus, string>,
    noInstitution: 'No institution',
  };
}
