import { getTranslations } from 'next-intl/server';
import { MDWizard } from './MDWizard';

export default async function NewMDSimulationPage() {
  const t = await getTranslations('md');

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">{t('newSimulation')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('wizardDescription')}
        </p>
      </div>
      <MDWizard />
    </div>
  );
}
