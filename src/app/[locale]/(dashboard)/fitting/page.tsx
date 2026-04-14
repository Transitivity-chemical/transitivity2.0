import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TrendingUp, LineChart, Waves } from 'lucide-react';
import { SubTabHistoryList, type SubTabHistoryRow } from '@/components/chemistry/SubTabHistoryList';

export default async function FittingHistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const jobs = await prisma.fittingJob.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 60,
    select: { id: true, name: true, status: true, modelType: true, createdAt: true },
  });

  const rows: SubTabHistoryRow[] = jobs.map((j) => ({
    id: `fit-${j.id}`,
    label: j.name ?? j.modelType,
    status: j.status ?? '—',
    createdAt: j.createdAt,
    subType: /transit/i.test(j.name ?? '') ? 'Transitivity' : 'Arrhenius',
    href: `/${locale}/fitting/history`,
  }));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-primary/10 p-2.5 text-primary">
          <TrendingUp className="size-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ajuste · Fitting</h1>
          <p className="text-sm text-muted-foreground">
            Histórico dos ajustes Arrhenius Plot e Transitivity Plot.
          </p>
        </div>
      </div>

      <SubTabHistoryList
        locale={locale}
        rows={rows}
        subTabs={[
          { label: 'Arrhenius Plot', href: '/fitting/arrhenius', icon: LineChart },
          { label: 'Transitivity Plot', href: '/fitting/transitivity', icon: Waves },
        ]}
      />
    </div>
  );
}
