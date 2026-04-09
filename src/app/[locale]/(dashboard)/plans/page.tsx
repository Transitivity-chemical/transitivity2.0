import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { PlansClient } from '@/components/plans/PlansClient';

/**
 * Phase 8 of megaplan: Plans page (logged-in only).
 *
 * Reference: docs/transitivity-overhaul-plan.md Phase 8
 *           docs/audit-questionpunk.md §1+§5 (plans modal pattern)
 */
export default async function PlansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const [planConfigs, currentUser] = await Promise.all([
    prisma.planConfig.findMany({ orderBy: { plan: 'asc' } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, credits: true },
    }),
  ]);

  return (
    <PlansClient
      locale={locale}
      planConfigs={planConfigs.map((p) => ({
        plan: p.plan,
        maxCredits: p.maxCredits,
        monthlyCredits: p.monthlyCredits,
        label: p.label,
        labelEn: p.labelEn,
        description: p.description,
        descriptionEn: p.descriptionEn,
      }))}
      currentPlan={currentUser?.plan ?? null}
      credits={Number(currentUser?.credits ?? 0)}
    />
  );
}
