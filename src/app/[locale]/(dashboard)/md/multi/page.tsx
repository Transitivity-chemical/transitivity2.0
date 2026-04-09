import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MDMultiClient } from './MDMultiClient';

/**
 * Phase 14B of megaplan: Multiple Inputs MD wizard page.
 */
export default async function MDMultiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);

  return <MDMultiClient />;
}
