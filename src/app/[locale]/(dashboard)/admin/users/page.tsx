import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isAdminRole } from '@/lib/access';
import { AdminUsersClient } from '@/components/admin/AdminUsersClient';

/**
 * Phase 6 of megaplan: Admin Users page (replaces Server Status).
 *
 * Server-side admin gate. Renders the client component which handles the table,
 * filters, modals, and CRUD calls.
 */
export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role;

  if (!isAdminRole(role)) {
    redirect(`/${locale}/dashboard`);
  }

  return <AdminUsersClient locale={locale} />;
}
