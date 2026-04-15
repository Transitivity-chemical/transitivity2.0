import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { MarcusTheoryTab } from '../MarcusTheoryTab';
import { TitleWithHint } from '@/components/common/TitleWithHint';
import { MarcusLambdaPreview } from '@/components/chemistry/previews';

export default async function MarcusPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-8">
      <div>
        <TitleWithHint
          title="Marcus Theory"
          preview={MarcusLambdaPreview}
          hint="Electron-transfer rate: ΔG‡ = (λ+ΔG°)²/(4λ). Uses vertical products at the reactant Franck-Condon geometry to compute λ."
        />
        <p className="text-sm text-muted-foreground">
          Electron-transfer rate constant via Marcus expression.
        </p>
      </div>
      <MarcusTheoryTab />
    </div>
  );
}
