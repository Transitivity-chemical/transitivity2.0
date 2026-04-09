import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { FittingHistoryClient } from './FittingHistoryClient';

/**
 * Phase 13 of megaplan: fitting history list page.
 */
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
    take: 50,
    include: { result: true },
  });

  return (
    <div className="p-6">
      <FittingHistoryClient
        locale={locale}
        jobs={JSON.parse(JSON.stringify(jobs))}
      />
    </div>
  );
}
