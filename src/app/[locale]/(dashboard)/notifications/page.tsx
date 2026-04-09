import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { NotificationsClient } from './NotificationsClient';

/**
 * FIX-14 of post-megaplan audit: full notifications page.
 *
 * Pattern adapted from docs/audit-campus-notifications.md §5.
 */
export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <NotificationsClient
      locale={locale}
      initial={JSON.parse(JSON.stringify(notifications))}
    />
  );
}
