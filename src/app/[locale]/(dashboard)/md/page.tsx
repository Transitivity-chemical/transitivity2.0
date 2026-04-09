import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MDWizard } from './new/MDWizard';

/**
 * FIX-10 of post-megaplan audit: /md is now the MD form directly,
 * matching the Tkinter v1 layout. The simulation list moved to /md/list.
 */
export default async function MdPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  return <MDWizard />;
}
