import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MDSimulationList } from '../MDSimulationList';

export default async function MdListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations('md');

  const simulations = await prisma.mDSimulation.findMany({
    where: { userId: session.user.id },
    include: {
      generatedFiles: {
        select: { id: true, fileType: true, filename: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-2">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${locale}/md`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Voltar · Back
          </Link>
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-2xl font-bold text-primary sm:text-3xl">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>
      </div>
      <MDSimulationList
        simulations={JSON.parse(JSON.stringify(simulations))}
        locale={locale}
      />
    </div>
  );
}
