import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage({
  params,
}: {
  params: { locale: string };
}) {
  const session = await auth();
  const { locale } = params;
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      plan: true,
      credits: true,
      institution: true,
      isInstitutional: true,
      createdAt: true,
    },
  });

  if (!user) redirect(`/${locale}/login`);

  const usageRecords = await prisma.usageRecord.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      operation: true,
      tokensUsed: true,
      createdAt: true,
    },
  });

  // Activity tab data — last 30 of each type, merged + sorted
  const [reactions, fittings, mds, mls] = await Promise.all([
    prisma.reaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, name: true, status: true, createdAt: true },
    }),
    prisma.fittingJob.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, name: true, status: true, createdAt: true },
    }),
    prisma.mDSimulation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, name: true, status: true, createdAt: true },
    }),
    prisma.mLJob.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, name: true, status: true, createdAt: true },
    }),
  ]);

  const activity = [
    ...reactions.map((r) => ({ ...r, type: 'Rate' })),
    ...fittings.map((r) => ({ ...r, type: 'Fitting' })),
    ...mds.map((r) => ({ ...r, type: 'MD' })),
    ...mls.map((r) => ({ ...r, type: 'ML' })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 30);

  return (
    <div className="px-6 pb-10 pt-6 sm:px-10">
      <SettingsClient
        user={JSON.parse(JSON.stringify(user))}
        usageRecords={JSON.parse(JSON.stringify(usageRecords))}
        activity={JSON.parse(JSON.stringify(activity))}
      />
    </div>
  );
}
