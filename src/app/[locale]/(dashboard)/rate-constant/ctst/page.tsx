import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { RateConstantWorkbench } from '../RateConstantWorkbench';
import { TitleWithHint } from '@/components/common/TitleWithHint';
import { RateConstantPreview } from '@/components/chemistry/previews';

export default async function CtstPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);
  const t = await getTranslations('rateConstant');

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="min-w-0">
        <TitleWithHint
          title="Conventional TST"
          preview={RateConstantPreview}
          className="text-2xl sm:text-3xl"
          hint="Transition State Theory with optional tunneling (Bell, Eckart, Wigner, d-TST) and solvent corrections (Smoluchowski, Collins-Kimball, Kramers)."
        />
        <p className="max-w-3xl text-sm text-muted-foreground">{t('workspaceDesc')}</p>
      </div>
      <RateConstantWorkbench />
    </div>
  );
}
