import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { MDSimulationList } from '../MDSimulationList';

export default async function MdListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations('md');

  const simulations = await prisma.mDSimulation.findMany({
    where: { userId: session.user.id },
    include: {
      generatedFiles: {
        select: { id: true, fileType: true, filename: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>
      </div>
      <MDSimulationList
        simulations={JSON.parse(JSON.stringify(simulations))}
        locale={locale}
      />
    </div>
  );
}
