import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Atom } from 'lucide-react';
import { MdTabsClient } from './MdTabsClient';

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
  const tNav = await getTranslations('nav');

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-primary/10 p-2.5 text-primary">
          <Atom className="size-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tNav('md')}</h1>
          <p className="text-sm text-muted-foreground">
            Gere inputs CPMD, BOMD, PIMD, SHMD ou MTD a partir de uma geometria.
          </p>
        </div>
      </div>
      <MdTabsClient />
    </div>
  );
}
