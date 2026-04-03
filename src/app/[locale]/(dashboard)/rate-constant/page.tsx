import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { RateConstantWorkbench } from './RateConstantWorkbench';

export default async function RateConstantPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const t = await getTranslations('rateConstant');

  return (
    <div className="p-8 space-y-6">
      <div>
        <div>
          <h1 className="text-2xl font-bold text-primary">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('workspaceDesc')}</p>
        </div>
      </div>
      <RateConstantWorkbench />
    </div>
  );
}
