import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { MDResult } from './MDResult';

export default async function MDSimulationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const session = await auth();
  const { locale, id } = await params;

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations('md');

  const simulation = await prisma.mDSimulation.findFirst({
    where: { id, userId: session.user.id },
    include: {
      inputMolecules: {
        include: { atoms: { orderBy: { atomIndex: 'asc' } } },
      },
      generatedFiles: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!simulation) {
    notFound();
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {simulation.name || `${simulation.mdMethod} Simulation`}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('resultDescription')}
        </p>
      </div>
      <MDResult
        simulation={JSON.parse(JSON.stringify(simulation))}
        locale={locale}
      />
    </div>
  );
}
