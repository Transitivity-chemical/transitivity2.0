import { getTranslations } from 'next-intl/server';
import { FittingWizard } from './FittingWizard';

export default async function ConfigureFittingPage() {
  const t = await getTranslations('fittingWizard');

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>
      <FittingWizard />
    </div>
  );
}
