import { getTranslations } from 'next-intl/server';
import { FittingWorkbench } from './FittingWorkbench';

export default async function FittingPage() {
  const t = await getTranslations('fittingWizard');
  const tNav = await getTranslations('nav');

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">{tNav('fitting')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('workspaceDesc')}</p>
      </div>
      <FittingWorkbench />
    </div>
  );
}
