import { getTranslations } from 'next-intl/server';
import { RateConstantWorkbench } from '../RateConstantWorkbench';

export default async function NewReactionPage() {
  const t = await getTranslations('rateConstant');

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('workspaceDesc')}</p>
      </div>
      <RateConstantWorkbench />
    </div>
  );
}
