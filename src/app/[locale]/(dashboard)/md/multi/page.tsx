import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { Atom, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MDMultiClient } from './MDMultiClient';
import { TitleWithHint } from '@/components/common/TitleWithHint';
import { MolecularDynamicsPreview } from '@/components/chemistry/previews';

export default async function MdMultiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);
  const tNav = await getTranslations('nav');

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2.5 text-primary">
            <Atom className="size-6" />
          </div>
          <div>
            <TitleWithHint
              title="Multiple Inputs"
              preview={MolecularDynamicsPreview}
              hint="Generate a batch of CPMD inputs by interpolating between two molecular structures. Sweep bond, angle, dihedral and temperature parameters."
            />
            <p className="text-sm text-muted-foreground">
              Gere múltiplos inputs CPMD interpolando entre duas estruturas.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/${locale}/md`}>
            <History className="mr-1.5 size-4" />
            {tNav('history')}
          </Link>
        </Button>
      </div>
      <MDMultiClient />
    </div>
  );
}
