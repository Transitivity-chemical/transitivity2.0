import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdminRole } from '@/lib/access';
import { AdminUsersClient } from '@/components/admin/AdminUsersClient';

/**
 * Admin Users page.
 *
 * Reads role FRESH FROM DB (not from JWT) so an admin promotion takes
 * effect immediately without sign-out + sign-in. Mirrors the dashboard
 * layout's pattern (FIX-3 of post-megaplan audit).
 */
export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !isAdminRole(user.role)) {
    redirect(`/${locale}/dashboard`);
  }

  return <AdminUsersClient locale={locale} />;
}
