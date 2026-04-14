import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { FlaskConical } from 'lucide-react';
import { MarcusTheoryTab } from '../MarcusTheoryTab';

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
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-primary/10 p-2.5 text-primary">
          <FlaskConical className="size-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marcus Theory</h1>
          <p className="text-sm text-muted-foreground">
            Electron-transfer rate constant via Marcus expression.
          </p>
        </div>
      </div>
      <MarcusTheoryTab />
    </div>
  );
}
