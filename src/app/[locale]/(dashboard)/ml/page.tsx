import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import { MLJobList } from './MLJobList';

export default async function MlPage() {
  const session = await auth();
  const t = await getTranslations('ml');

  const jobs = await prisma.mLJob.findMany({
    where: { userId: session!.user!.id! },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      name: true,
      mlProvider: true,
      mlTaskType: true,
      neuralPotential: true,
      status: true,
      errorMessage: true,
      createdAt: true,
      completedAt: true,
    },
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>
      </div>
      <MLJobList jobs={jobs} />
    </div>
  );
}
