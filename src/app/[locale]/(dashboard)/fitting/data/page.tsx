import { getTranslations } from 'next-intl/server';
import { ExperimentalDataClient } from './ExperimentalDataClient';

export default async function ExperimentalDataPage() {
  const t = await getTranslations('fitting');

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">{t('dataInput')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('dataInputDescription')}
        </p>
      </div>
      <ExperimentalDataClient />
    </div>
  );
}
