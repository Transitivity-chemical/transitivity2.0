import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { FlaskConical, Atom, Sparkles } from 'lucide-react';
import { SubTabHistoryList, type SubTabHistoryRow } from '@/components/chemistry/SubTabHistoryList';

export default async function RateConstantHistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const reactions = await prisma.reaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 60,
    select: { id: true, name: true, status: true, createdAt: true },
  });

  const rows: SubTabHistoryRow[] = reactions.map((r) => ({
    id: `rc-${r.id}`,
    label: r.name ?? 'Rate constant run',
    status: r.status ?? '—',
    createdAt: r.createdAt,
    subType: /marcus/i.test(r.name ?? '') ? 'Marcus' : 'CTST',
    href: `/${locale}/rate-constant/${r.id}`,
  }));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-primary/10 p-2.5 text-primary">
          <FlaskConical className="size-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Constante de Velocidade</h1>
          <p className="text-sm text-muted-foreground">
            Histórico dos cálculos de Conventional TST e Marcus Theory.
          </p>
        </div>
      </div>

      <SubTabHistoryList
        locale={locale}
        rows={rows}
        subTabs={[
          { label: 'Conventional TST', href: '/rate-constant/ctst', icon: Atom },
          { label: 'Marcus Theory', href: '/rate-constant/marcus', icon: Sparkles },
        ]}
      />
    </div>
  );
}
