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
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <TrendingUp className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{tNav('fitting')}</h1>
            <p className="text-sm text-muted-foreground">{t('workspaceDesc')}</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
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
