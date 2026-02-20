import { getTranslations } from 'next-intl/server';
import { ReactionWizard } from './ReactionWizard';

export default async function NewReactionPage() {
  const t = await getTranslations('rateConstant');

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{t('newReaction')}</h1>
      <ReactionWizard />
    </div>
  );
}
