import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { RateConstantResults } from './RateConstantResults';

export default async function ReactionResultPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const session = await auth();
  const { locale, id } = await params;
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const reaction = await prisma.reaction.findFirst({
    where: { id, userId: session.user.id },
    include: {
      species: { orderBy: { sortOrder: 'asc' } },
      temperatureGrid: true,
      solventConfig: true,
    },
  });

  if (!reaction) notFound();

  return (
    <div className="p-6">
      <RateConstantResults reaction={JSON.parse(JSON.stringify(reaction))} />
    </div>
  );
}
