import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, TrendingUp, Atom, Brain, MessageCircle, Activity, Coins, Briefcase } from 'lucide-react';

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

  const [reactionCount, fittingCount, mdCount, mlCount] = await Promise.all([
    prisma.reaction.count({ where: { userId } }),
    prisma.fittingJob.count({ where: { userId } }),
    prisma.mDSimulation.count({ where: { userId } }),
    prisma.mLJob.count({ where: { userId } }),
  ]);

  const totalCalc = reactionCount + fittingCount + mdCount + mlCount;

  // Fetch user credits
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  const creditsUsed = Number(user?.credits ?? 0);

  // Count active (running/pending) jobs
  const [activeFitting, activeML] = await Promise.all([
    prisma.fittingJob.count({ where: { userId, status: { in: ['PENDING', 'RUNNING'] } } }),
    prisma.mLJob.count({ where: { userId, status: { in: ['PENDING', 'RUNNING'] } } }),
  ]);
  const activeJobs = activeFitting + activeML;

  // Recent activity: last 5 items across tables
  const [recentReactions, recentFitting, recentMD, recentML] = await Promise.all([
    prisma.reaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.fittingJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, createdAt: true, status: true },
    }),
    prisma.mDSimulation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.mLJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, createdAt: true, status: true, neuralPotential: true },
    }),
  ]);

  type ActivityItem = { id: string; label: string; type: string; createdAt: Date };
  const allActivity: ActivityItem[] = [
    ...recentReactions.map((r) => ({ id: r.id, label: r.name, type: 'Reaction', createdAt: r.createdAt })),
    ...recentFitting.map((f) => ({ id: f.id, label: `Fitting (${f.status})`, type: 'Fitting', createdAt: f.createdAt })),
    ...recentMD.map((m) => ({ id: m.id, label: m.name ?? 'MD Simulation', type: 'MD', createdAt: m.createdAt })),
    ...recentML.map((m) => ({ id: m.id, label: `ML ${m.neuralPotential ?? ''} (${m.status})`, type: 'ML', createdAt: m.createdAt })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

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
    { href: `/${locale}/ml`, icon: Brain, label: tNav('ml'), count: mlCount },
    { href: `/${locale}/assistant`, icon: MessageCircle, label: tNav('assistant'), count: null },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        {t('welcome', { name: session?.user?.name ?? session?.user?.email ?? '' })}
      </h1>

      {/* Summary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        {/* Mini server status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
            <span className="text-sm font-semibold">{t('allSystems')}</span>
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent activity feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            {allActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noActivity')}</p>
            ) : (
              <ul className="space-y-3">
                {allActivity.map((item) => (
                  <li key={`${item.type}-${item.id}`} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {item.type}
                      </span>
                      <span className="truncate max-w-[200px]">{item.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {item.createdAt.toLocaleDateString(locale)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Activity chart (last 7 days) + Quick actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('recentActivity')} (7d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-24">
                {dayBuckets.map((bucket) => (
                  <div key={bucket.label} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full flex justify-center">
                      <div
                        className="w-6 rounded-t bg-primary"
                        style={{
                          height: `${Math.max((bucket.count / maxCount) * 72, 4)}px`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{bucket.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('quickActions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
                <p className="text-sm text-muted-foreground">{t('dropFile')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
