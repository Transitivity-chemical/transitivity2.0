import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdminRole } from '@/lib/access';
import {
  BarChart3,
  Users,
  FlaskConical,
  Atom,
  TrendingUp,
  Folder,
  Download,
  Sparkles,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format-date';
import { AnalyticsCharts } from './AnalyticsCharts';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default async function AdminAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!me || !isAdminRole(me.role)) redirect(`/${locale}/dashboard`);

  // Top-level totals
  const [
    userCount,
    activeUsers,
    pendingUsers,
    reactionCount,
    mdCount,
    fitCount,
    fileCount,
    fileBytes,
    usageSum,
    recentReactions,
    recentMds,
    recentFits,
    planStats,
    topUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, isActive: true } }),
    prisma.user.count({ where: { deletedAt: null, pendingApproval: true } }),
    prisma.reaction.count(),
    prisma.mDSimulation.count(),
    prisma.fittingJob.count(),
    prisma.fileUpload.count(),
    prisma.fileUpload.aggregate({ _sum: { sizeBytes: true } }),
    prisma.usageRecord.aggregate({ _sum: { tokensUsed: true } }),
    prisma.reaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { createdAt: true },
    }),
    prisma.mDSimulation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { createdAt: true },
    }),
    prisma.fittingJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { createdAt: true },
    }),
    prisma.user.groupBy({
      by: ['plan'],
      where: { deletedAt: null, plan: { not: null } },
      _count: { plan: true },
    }),
    prisma.user.findMany({
      where: { deletedAt: null },
      take: 10,
      orderBy: { credits: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        plan: true,
        credits: true,
        role: true,
        isActive: true,
        _count: { select: { uploads: true, reactions: true, mdSimulations: true, fittingJobs: true } },
      },
    }),
  ]);

  // 14-day activity timeline
  const days: { date: string; rc: number; md: number; fit: number }[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, rc: 0, md: 0, fit: 0 });
  }
  const bucket = (arr: { createdAt: Date }[], field: 'rc' | 'md' | 'fit') => {
    for (const r of arr) {
      const key = r.createdAt.toISOString().slice(0, 10);
      const day = days.find((d) => d.date === key);
      if (day) day[field] += 1;
    }
  };
  bucket(recentReactions, 'rc');
  bucket(recentMds, 'md');
  bucket(recentFits, 'fit');

  const totalBytes = fileBytes._sum.sizeBytes ?? 0;
  const totalCreditsUsed = Number(usageSum._sum.tokensUsed ?? 0);
  const totalCalculations = reactionCount + mdCount + fitCount;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2.5 text-primary">
            <BarChart3 className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Visão geral da plataforma: usuários, cálculos, armazenamento e créditos.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="/api/v1/admin/analytics/download?format=csv" download>
              <Download className="mr-1.5 size-4" />
              CSV
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/api/v1/admin/analytics/download?format=json" download>
              <Download className="mr-1.5 size-4" />
              JSON
            </a>
          </Button>
          <Button variant="outline" size="sm" disabled title="Em breve">
            <Sparkles className="mr-1.5 size-4" />
            Analisar com IA
          </Button>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi icon={Users} label="Usuários" value={userCount.toString()} sub={`${activeUsers} ativos · ${pendingUsers} pendentes`} />
        <Kpi icon={FlaskConical} label="Cálculos totais" value={totalCalculations.toString()} sub="reações + MD + ajustes" />
        <Kpi icon={FlaskConical} label="Rate constant" value={reactionCount.toString()} />
        <Kpi icon={Atom} label="MD" value={mdCount.toString()} />
        <Kpi icon={TrendingUp} label="Fitting" value={fitCount.toString()} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi icon={Folder} label="Arquivos" value={fileCount.toString()} sub={formatBytes(totalBytes)} />
        <Kpi icon={TrendingUp} label="Créditos usados" value={totalCreditsUsed.toFixed(0)} />
        <Kpi icon={Users} label="Distribuição de planos" value={planStats.map((p) => `${p.plan}:${p._count.plan}`).join(' · ') || '—'} />
      </div>

      {/* Charts */}
      <AnalyticsCharts days={days} planStats={planStats.map((p) => ({ plan: String(p.plan), count: p._count.plan }))} />

      {/* Top users table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Top usuários por créditos restantes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Usuário</th>
                  <th className="px-4 py-2 font-medium">Plano</th>
                  <th className="px-4 py-2 font-medium">Créditos</th>
                  <th className="px-4 py-2 font-medium">Cálculos</th>
                  <th className="px-4 py-2 font-medium">Arquivos</th>
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {topUsers.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-4 py-2">
                      <p className="font-medium">{u.fullName}</p>
                      <p className="text-[11px] text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="outline" className="text-[10px]">{u.plan ?? '—'}</Badge>
                    </td>
                    <td className="px-4 py-2 font-mono tabular-nums">{Number(u.credits).toFixed(0)}</td>
                    <td className="px-4 py-2 font-mono tabular-nums">
                      {u._count.reactions + u._count.mdSimulations + u._count.fittingJobs}
                    </td>
                    <td className="px-4 py-2 font-mono tabular-nums">{u._count.uploads}</td>
                    <td className="px-4 py-2 text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/${locale}/admin/users/${u.id}`}>
                          <Eye className="size-3.5" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <p className="mt-1 font-mono text-2xl font-semibold">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
