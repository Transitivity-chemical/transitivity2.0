import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
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

  return (
    <div className="p-6">
      <SettingsClient
        user={JSON.parse(JSON.stringify(user))}
        usageRecords={JSON.parse(JSON.stringify(usageRecords))}
      />
    </div>
  );
}
