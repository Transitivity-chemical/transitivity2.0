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
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        {t('welcome', { name: session?.user?.name ?? session?.user?.email ?? '' })}
      </h1>

      {/* Summary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalCalc')}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Activity className="size-5 text-primary" />
            <span className="text-2xl font-bold">{totalCalc}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('creditsUsed')}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Coins className="size-5 text-primary" />
            <span className="text-2xl font-bold">{creditsUsed}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('activeJobs')}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Briefcase className="size-5 text-primary" />
            <span className="text-2xl font-bold">{activeJobs}</span>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {quickLinks.map(({ href, icon: Icon, label, count }) => (
          <Link key={href} href={href}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex flex-col items-center gap-2 pt-6 pb-4">
                <Icon className="size-8 text-primary" />
                <p className="text-sm font-medium">{label}</p>
                {count != null && (
                  <p className="text-xs text-muted-foreground">{count} items</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* All calculations — full-width main panel (FIX-2) */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Suas calculações</CardTitle>
          <span className="text-xs text-muted-foreground">{allActivity.length} itens</span>
        </CardHeader>
        <CardContent>
          {allActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhuma calculação ainda. Use a barra lateral para começar.
            </p>
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
