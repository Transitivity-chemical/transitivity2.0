import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, TrendingUp, Atom, Activity, Coins, Briefcase } from 'lucide-react';

type QuickLink = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
};

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const t = await getTranslations('dashboard');
  const tNav = await getTranslations('nav');

  const userId = session.user.id;

  // Fire every query in parallel — single network round-trip via pgbouncer.
  const [
    reactionCount,
    fittingCount,
    mdCount,
    user,
    activeFitting,
    activeMD,
    recentReactions,
    recentFitting,
    recentMD,
  ] = await Promise.all([
    prisma.reaction.count({ where: { userId } }),
    prisma.fittingJob.count({ where: { userId } }),
    prisma.mDSimulation.count({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { credits: true } }),
    prisma.fittingJob.count({ where: { userId, status: { in: ['PENDING', 'RUNNING'] } } }),
    prisma.mDSimulation.count({ where: { userId, status: { in: ['PENDING', 'RUNNING'] } } }),
    prisma.reaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, name: true, status: true, createdAt: true },
    }),
    prisma.fittingJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, name: true, modelType: true, createdAt: true, status: true },
    }),
    prisma.mDSimulation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, name: true, mdMethod: true, status: true, createdAt: true },
    }),
  ]);

  const totalCalc = reactionCount + fittingCount + mdCount;
  const creditsUsed = Number(user?.credits ?? 0);
  const activeJobs = activeFitting + activeMD;

  type ActivityItem = {
    id: string;
    label: string;
    type: string;
    status: string;
    createdAt: Date;
    href: string;
  };
  const allActivity: ActivityItem[] = [
    ...recentReactions.map((r) => ({
      id: r.id,
      label: r.name,
      type: 'Constante',
      status: r.status,
      createdAt: r.createdAt,
      href: `/${locale}/rate-constant/${r.id}`,
    })),
    ...recentFitting.map((f) => ({
      id: f.id,
      label: f.name || `${f.modelType} fit`,
      type: 'Ajuste',
      status: f.status,
      createdAt: f.createdAt,
      href: `/${locale}/fitting?jobId=${f.id}`,
    })),
    ...recentMD.map((m) => ({
      id: m.id,
      label: m.name ?? `${m.mdMethod} MD`,
      type: 'Dinâmica',
      status: m.status,
      createdAt: m.createdAt,
      href: `/${locale}/md/${m.id}`,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 50);

  // Build last-7-days chart data
  const now = new Date();
  const dayBuckets: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toLocaleDateString(locale, { weekday: 'short' });
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const count = allActivity.filter(
      (a) => a.createdAt >= start && a.createdAt < end,
    ).length;
    dayBuckets.push({ label: dayStr, count });
  }
  const maxCount = Math.max(...dayBuckets.map((b) => b.count), 1);

  const quickLinks: QuickLink[] = [
    { href: `/${locale}/rate-constant/new`, icon: Calculator, label: tNav('rateConstant'), count: reactionCount },
    { href: `/${locale}/fitting`, icon: TrendingUp, label: tNav('fitting'), count: fittingCount },
    { href: `/${locale}/md`, icon: Atom, label: tNav('md'), count: mdCount },
  ];

  const firstName =
    (session?.user?.name ?? session?.user?.email ?? '').split(' ')[0] || '';
  const latestItem = allActivity[0];
  const totalWeekActivity = dayBuckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const formatStatus = (status: string) =>
    status
      .toLowerCase()
      .split('_')
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ');

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-5 pb-16 pt-8 lg:px-10">
      <section className="rounded-xl border border-border/70 bg-card/80 p-6 shadow-sm lg:p-7">
        <div className="flex flex-wrap items-start gap-6">
          <div className="min-w-[240px] flex-1">
            <p className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground/70">
              {t('quickStart')}
            </p>
            <h1 className="mt-3 text-[32px] font-semibold leading-tight tracking-tight">
              {t('welcome', { name: firstName })}
            </h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-5 text-muted-foreground">
              {t('dropFile')}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-card/70 px-5 py-4 text-right shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground/70">
              {t('recentActivity')}
            </p>
            <p className="mt-2 text-[26px] font-semibold font-mono tabular-nums">
              {allActivity.length.toLocaleString(locale)}
            </p>
            <p className="text-xs text-muted-foreground/80">50 max snapshot</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatCard icon={Activity} label={t('totalCalc')} value={totalCalc} accent="primary" locale={locale} />
          <StatCard icon={Coins} label={t('creditsUsed')} value={creditsUsed} accent="amber" locale={locale} />
          <StatCard icon={Briefcase} label={t('activeJobs')} value={activeJobs} accent="green" locale={locale} />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,1fr)]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground/70">
              {t('quickActions')}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {quickLinks.map((item) => (
                <QuickLaunchCard key={item.href} {...item} locale={locale} />
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border/60 bg-card/60 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground/70">{t('usage')}</p>
              <span className="text-xs text-muted-foreground/70">7d</span>
            </div>
            <div className="mt-5 flex items-end gap-1.5 sm:gap-2 min-w-0">
              {dayBuckets.map((bucket) => {
                const height = (bucket.count / maxCount) * 72;
                return (
                  <div key={bucket.label} className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[10px] text-muted-foreground/80">
                    <div
                      className="flex w-full items-end justify-center rounded-sm border border-border/50 bg-foreground/[0.04] px-1 pb-1 pt-2"
                      style={{ height: `${height + 24}px` }}
                    >
                      <span
                        className="w-1.5 rounded-sm bg-foreground/70"
                        style={{ height: `${Math.max(6, height)}px` }}
                      />
                    </div>
                    <span className="truncate font-semibold tracking-wide">{bucket.label}</span>
                    <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums">{bucket.count}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground/70 font-mono">
              {totalWeekActivity.toLocaleString(locale)} / 7d
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
        <div className="rounded-lg border border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="flex flex-col gap-1 border-b border-border/50 px-6 py-6">
            <p className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground/70">{t('recentActivity')}</p>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {t('usage')}
            </CardTitle>
            <span className="text-xs text-muted-foreground/80">
              {allActivity.length.toLocaleString(locale)} {allActivity.length === 1 ? 'registro' : 'registros'}
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {allActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                <div className="inline-flex size-11 items-center justify-center rounded-lg border border-dashed border-border/60 bg-background/70 text-muted-foreground/70 shadow-sm">
                  <Activity className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-tight">{t('noActivity')}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('quickStart')}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {quickLinks.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="rounded-md border border-border/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 transition hover:border-foreground/50 hover:text-foreground"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-transparent px-2 pb-2 pt-2 sm:px-4">
                <div className="overflow-x-auto rounded-lg border border-border/50 shadow-sm">
                  <table className="w-full min-w-[640px] text-sm" aria-label={t('recentActivity')}>
                    <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground/80">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-medium">
                          Tipo
                        </th>
                        <th scope="col" className="px-4 py-3 font-medium">
                          Nome
                        </th>
                        <th scope="col" className="px-4 py-3 font-medium">
                          Status
                        </th>
                        <th scope="col" className="px-4 py-3 font-medium">
                          Data
                        </th>
                        <th scope="col" className="px-4 py-3 text-right font-medium">
                          Link
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allActivity.map((item) => (
                        <tr key={`${item.type}-${item.id}`} className="border-t border-border/40 hover:bg-muted/10">
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-md border border-border/60 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em]">
                              {item.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium">{item.label}</td>
                          <td className="px-4 py-3">
                            <span
                              aria-label={formatStatus(item.status)}
                              className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                                item.status === 'COMPLETED'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : item.status === 'FAILED'
                                    ? 'bg-rose-500/10 text-rose-500'
                                    : item.status === 'RUNNING' || item.status === 'PENDING'
                                      ? 'bg-amber-400/10 text-amber-400'
                                      : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                            {item.createdAt.toLocaleString(locale)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link href={item.href} className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground transition hover:text-primary">
                              Abrir
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-border/70 bg-card/80 p-5 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground/70">
              {t('usage')}
            </p>
            <div className="mt-4 space-y-3">
              {quickLinks.map((item) => (
                <QueueRow key={`${item.href}-summary`} {...item} locale={locale} />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-card/80 p-5 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground/70">{t('recentActivity')}</p>
            {latestItem ? (
              <div className="mt-4 space-y-3">
                <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
                  {latestItem.type}
                </p>
                <p className="text-[22px] font-semibold leading-snug tracking-tight">{latestItem.label}</p>
                <div className="text-[12px] leading-5 text-muted-foreground">
                  <p>{formatStatus(latestItem.status)}</p>
                  <p className="mt-1">{latestItem.createdAt.toLocaleString(locale)}</p>
                </div>
                <Link
                  href={latestItem.href}
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-primary transition hover:text-primary/80"
                >
                  Abrir registro →
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-[13px] leading-5 text-muted-foreground">{t('noActivity')}</p>
            )}
          </div>
        </aside>
      </section>

    </div>
  );
}

function QuickLaunchCard({
  href,
  icon: Icon,
  label,
  count,
  locale,
}: QuickLink & { locale: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-lg border border-border/70 bg-card/80 px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-foreground/60"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-md bg-foreground/[0.08] text-foreground/80 transition group-hover:bg-foreground/[0.15] group-hover:text-foreground">
          <Icon className="size-5" />
        </span>
        <span className="truncate text-sm font-semibold tracking-tight">{label}</span>
      </div>
      {typeof count === 'number' && (
        <span className="rounded-md border border-border/60 px-2 py-0.5 text-[11px] font-semibold font-mono tabular-nums text-muted-foreground/80">
          {count.toLocaleString(locale)}
        </span>
      )}
    </Link>
  );
}

function QueueRow({
  icon: Icon,
  label,
  count,
  locale,
}: QuickLink & { locale: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between rounded-lg border border-border/70 px-4 py-3 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex size-9 items-center justify-center rounded-md bg-foreground/[0.06] text-foreground/70">
          <Icon className="size-4" />
        </span>
        <span className="truncate text-sm font-medium tracking-tight">{label}</span>
      </div>
      {typeof count === 'number' && (
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground/70 tabular-nums">
          {count.toLocaleString(locale)}
        </span>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  locale,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: 'primary' | 'amber' | 'green';
  locale: string;
}) {
  const accentCls =
    accent === 'amber'
      ? 'bg-amber-500/15 text-amber-300'
      : accent === 'green'
        ? 'bg-emerald-500/15 text-emerald-300'
        : 'bg-primary/15 text-primary';
  return (
    <div className="rounded-lg border border-border/70 bg-card/80 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground/70">{label}</p>
          <p className="mt-1 text-[28px] font-semibold tracking-tight font-mono tabular-nums">
            {value.toLocaleString(locale)}
          </p>
        </div>
        <span className={`inline-flex size-10 items-center justify-center rounded-md ${accentCls}`}>
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}
