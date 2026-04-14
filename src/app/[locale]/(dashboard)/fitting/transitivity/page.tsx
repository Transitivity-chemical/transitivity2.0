import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { TrendingUp, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/auth';
import { TransitivityPlotTab } from '../TransitivityPlotTab';

export default async function FittingTransitivityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const tNav = await getTranslations('nav');
  const t = await getTranslations('fittingWizard');

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2.5 text-primary">
            <TrendingUp className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transitivity Plot</h1>
            <p className="text-sm text-muted-foreground">{t('workspaceDesc')}</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/${locale}/fitting/history`}>
            <History className="mr-1.5 size-4" />
            {tNav('history')}
          </Link>
        </Button>
      </div>
      <TransitivityPlotTab />
    </div>
  );
}
