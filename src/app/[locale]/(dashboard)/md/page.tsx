import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Atom, Layers } from 'lucide-react';
import { SubTabHistoryList, type SubTabHistoryRow } from '@/components/chemistry/SubTabHistoryList';

export default async function MdHistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const sims = await prisma.mDSimulation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 60,
    select: { id: true, name: true, status: true, mdMethod: true, createdAt: true },
  });

  const rows: SubTabHistoryRow[] = sims.map((s) => ({
    id: `md-${s.id}`,
    label: s.name ?? s.mdMethod,
    status: s.status ?? '—',
    createdAt: s.createdAt,
    subType: /multi/i.test(s.name ?? '') ? 'Multi' : 'Single',
    href: `/${locale}/md/${s.id}`,
  }));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-primary/10 p-2.5 text-primary">
          <Atom className="size-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dinâmica Molecular</h1>
          <p className="text-sm text-muted-foreground">
            Histórico dos cálculos de Single Input e Multiple Inputs.
          </p>
        </div>
      </div>

      <SubTabHistoryList
        locale={locale}
        rows={rows}
        subTabs={[
          { label: 'Single Input', href: '/md/single', icon: Atom },
          { label: 'Multiple Inputs', href: '/md/multi', icon: Layers },
        ]}
      />
    </div>
  );
}
