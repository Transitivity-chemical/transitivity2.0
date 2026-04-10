import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, TrendingUp, Atom, Activity, Coins, Briefcase } from 'lucide-react';

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

  const [reactionCount, fittingCount, mdCount] = await Promise.all([
    prisma.reaction.count({ where: { userId } }),
    prisma.fittingJob.count({ where: { userId } }),
    prisma.mDSimulation.count({ where: { userId } }),
  ]);

  const totalCalc = reactionCount + fittingCount + mdCount;

  // Fetch user credits
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  const creditsUsed = Number(user?.credits ?? 0);

  // Count active (running/pending) jobs
  const [activeFitting, activeMD] = await Promise.all([
    prisma.fittingJob.count({ where: { userId, status: { in: ['PENDING', 'RUNNING'] } } }),
    prisma.mDSimulation.count({ where: { userId, status: { in: ['PENDING', 'RUNNING'] } } }),
  ]);
  const activeJobs = activeFitting + activeMD;

  // All calculations: latest 50 across all tables (FIX-2 of post-megaplan audit)
  const [recentReactions, recentFitting, recentMD] = await Promise.all([
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

  const quickLinks = [
    { href: `/${locale}/rate-constant/new`, icon: Calculator, label: tNav('rateConstant'), count: reactionCount },
    { href: `/${locale}/fitting`, icon: TrendingUp, label: tNav('fitting'), count: fittingCount },
    { href: `/${locale}/md`, icon: Atom, label: tNav('md'), count: mdCount },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('welcome', { name: (session?.user?.name ?? session?.user?.email ?? '').split(' ')[0] })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe suas calculações e gere novos inputs em um só lugar.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Activity} label={t('totalCalc')} value={totalCalc} accent="primary" />
        <StatCard icon={Coins} label={t('creditsUsed')} value={creditsUsed} accent="amber" />
        <StatCard icon={Briefcase} label={t('activeJobs')} value={activeJobs} accent="green" />
      </div>

      {/* Quick links */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Atalhos
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map(({ href, icon: Icon, label, count }) => (
            <Link key={href} href={href}>
              <Card className="group hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="flex items-center gap-4 py-5">
                  <div className="rounded-lg bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{label}</p>
                    {count != null && (
                      <p className="text-xs text-muted-foreground">
                        {count} {count === 1 ? 'item' : 'itens'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* All calculations — full-width main panel (FIX-2) */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Suas calculações</CardTitle>
          <span className="text-xs text-muted-foreground">{allActivity.length} itens</span>
        </CardHeader>
        <CardContent>
          {allActivity.length === 0 ? (
            <div className="py-12 text-center">
              <Activity className="mx-auto mb-3 size-10 text-muted-foreground/50" />
              <p className="text-sm font-medium">Nenhuma calculação ainda</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Comece gerando seu primeiro input.
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                <Link href={`/${locale}/rate-constant`} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                  Constante de velocidade
                </Link>
                <Link href={`/${locale}/md`} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                  Dinâmica molecular
                </Link>
                <Link href={`/${locale}/fitting`} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                  Ajuste de curvas
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">Tipo</th>
                    <th className="px-3 py-2 font-medium">Nome</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Data</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {allActivity.map((item) => (
                    <tr key={`${item.type}-${item.id}`} className="border-t hover:bg-muted/20">
                      <td className="px-3 py-2">
                        <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-medium">{item.label}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                          item.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                          : item.status === 'FAILED' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                          : item.status === 'RUNNING' || item.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-muted text-muted-foreground'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {item.createdAt.toLocaleString(locale)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Link href={item.href} className="text-xs text-primary hover:underline">
                          Abrir →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: 'primary' | 'amber' | 'green';
}) {
  const accentCls =
    accent === 'amber'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
      : accent === 'green'
        ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
        : 'bg-primary/10 text-primary';
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`rounded-lg p-3 ${accentCls}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold tracking-tight tabular-nums">{value.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}
