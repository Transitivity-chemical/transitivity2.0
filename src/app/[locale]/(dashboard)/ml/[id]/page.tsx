import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { MLResult } from './MLResult';

export default async function MLJobPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const t = await getTranslations('ml');

  const job = await prisma.mLJob.findFirst({
    where: { id, userId: session!.user!.id! },
  });

  if (!job) {
    notFound();
  }

  // Serialize Decimal and Date fields for the client component
  const serializedJob = {
    ...job,
    tokensConsumed: Number(job.tokensConsumed),
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-primary">
        {job.name || t('untitled')}
      </h1>
      <MLResult job={serializedJob} />
    </div>
  );
}
