import { getTranslations } from 'next-intl/server';
import { MLWizard } from './MLWizard';

export default async function PredictPage() {
  const t = await getTranslations('ml');

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">{t('newPrediction')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('wizardDescription')}</p>
      </div>
      <MLWizard />
    </div>
  );
}
