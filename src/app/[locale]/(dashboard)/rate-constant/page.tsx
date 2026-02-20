import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calculator } from 'lucide-react';

export default async function RateConstantPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const t = await getTranslations('rateConstant');

  const reactions = await prisma.reaction.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      reactionType: true,
      status: true,
      updatedAt: true,
      species: { select: { role: true } },
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Link href={`/${locale}/rate-constant/new`}>
          <Button>
            <Plus className="mr-2 size-4" />
            {t('newReaction')}
          </Button>
        </Link>
      </div>

      {reactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Calculator className="size-12 text-muted-foreground" />
            <p className="text-muted-foreground">{t('noReactions')}</p>
            <Link href={`/${locale}/rate-constant/new`}>
              <Button variant="outline">{t('newReaction')}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reactions.map((r) => (
            <Link key={r.id} href={`/${locale}/rate-constant/${r.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{r.name}</CardTitle>
                    <Badge variant={r.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {r.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{r.reactionType}</span>
                    <span>·</span>
                    <span>
                      {r.species.filter((s) => s.role === 'REACTANT').length}R +{' '}
                      {r.species.filter((s) => s.role === 'TRANSITION_STATE').length}TS +{' '}
                      {r.species.filter((s) => s.role === 'PRODUCT').length}P
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(r.updatedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
