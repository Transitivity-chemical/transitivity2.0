import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { DashboardShell } from './DashboardShell';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  // Read role/plan/credits FRESH from DB on every dashboard load.
  // This way an admin promotion or plan change takes effect immediately
  // without requiring sign-out + sign-in to refresh the JWT.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      plan: true,
      credits: true,
      pendingApproval: true,
      mustChangePassword: true,
    },
  });

  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (user.pendingApproval) {
    redirect(`/${locale}/pending-approval`);
  }

  if (user.mustChangePassword) {
    redirect(`/${locale}/change-password`);
  }

  const role = user.role;
  const credits = Number(user.credits ?? 0);
  const plan = user.plan ?? null;

  return (
    <SessionProvider>
      <TooltipProvider>
        <DashboardShell credits={credits} role={role} plan={plan}>
          {children}
        </DashboardShell>
      </TooltipProvider>
    </SessionProvider>
  );
}
