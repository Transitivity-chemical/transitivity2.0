import { getTranslations } from 'next-intl/server';
import { FittingResults } from './FittingResults';

export default async function FittingResultsPage() {
  const t = await getTranslations('fittingWizard');

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">{t('results')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('resultsDesc')}
        </p>
      </div>
      <FittingResults />
    </div>
  );
}
