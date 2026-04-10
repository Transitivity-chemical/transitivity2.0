import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { TrendingUp, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FittingWorkbench } from './FittingWorkbench';

export default async function FittingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations('fittingWizard');
  const tNav = await getTranslations('nav');
  const { locale } = await params;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <TrendingUp className="size-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{tNav('fitting')}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">{t('workspaceDesc')}</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
          <Link href={`/${locale}/fitting/history`}>
            <History className="mr-1.5 size-4" />
            Histórico
          </Link>
        </Button>
      </div>
      <FittingWorkbench />
    </div>
  );
}
