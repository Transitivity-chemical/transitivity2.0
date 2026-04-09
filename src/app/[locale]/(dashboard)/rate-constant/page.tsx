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
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('workspaceDesc')}</p>
        </div>
      </div>
      <RateConstantWorkbench />
    </div>
  );
}
