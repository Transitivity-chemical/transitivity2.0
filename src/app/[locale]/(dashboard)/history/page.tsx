import { formatDateTime } from '@/lib/format-date';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Clock, FlaskConical, Atom, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const userId = session.user.id;
  const [rateConstants, mdJobs, fittingJobs] = await Promise.all([
    prisma.reaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 40,
      select: { id: true, name: true, status: true, createdAt: true },
    }),
    prisma.mDSimulation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 40,
      select: { id: true, name: true, status: true, mdMethod: true, createdAt: true },
    }),
    prisma.fittingJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 40,
      select: { id: true, name: true, status: true, modelType: true, createdAt: true },
    }),
  ]);

  type Row = { id: string; type: string; label: string; status: string; createdAt: Date; href: string; icon: typeof FlaskConical };
  const rows: Row[] = [
    ...rateConstants.map<Row>((r) => ({
      id: `rc-${r.id}`,
      type: 'rate-constant',
      label: r.name ?? 'Rate constant',
      status: r.status ?? '—',
      createdAt: r.createdAt,
      href: `/${locale}/rate-constant/${r.id}`,
      icon: FlaskConical,
    })),
    ...mdJobs.map<Row>((m) => ({
      id: `md-${m.id}`,
      type: 'md',
      label: m.name ?? m.mdMethod,
      status: m.status ?? '—',
      createdAt: m.createdAt,
      href: `/${locale}/md/${m.id}`,
      icon: Atom,
    })),
    ...fittingJobs.map<Row>((f) => ({
      id: `fit-${f.id}`,
      type: 'fitting',
      label: f.name ?? f.modelType,
      status: f.status ?? '—',
      createdAt: f.createdAt,
      href: `/${locale}/fitting/history`,
      icon: TrendingUp,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-primary/10 p-2.5 text-primary">
          <Clock className="size-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {locale === 'pt-BR' ? 'Histórico' : 'History'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {locale === 'pt-BR'
              ? 'Todas as suas simulações, ajustes e cálculos em uma só lista.'
              : 'All your simulations, fits and calculations in one list.'}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum cálculo ainda.
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <ul className="divide-y">
              {rows.map((row) => {
                const Icon = row.icon;
                return (
                  <li key={row.id}>
                    <Link
                      href={row.href}
                      className="flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-accent/40"
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{row.label}</p>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{row.type}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{row.status}</Badge>
                      <span className="hidden w-32 text-right text-xs tabular-nums text-muted-foreground sm:inline">
                        {formatDateTime(row.createdAt, locale)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
