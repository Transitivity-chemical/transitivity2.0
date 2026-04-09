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
  const sessionUser = session?.user as
    | {
        id?: string;
        role?: string;
        plan?: string | null;
        mustChangePassword?: boolean;
        pendingApproval?: boolean;
      }
    | undefined;
  const role = sessionUser?.role;

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  if (sessionUser?.pendingApproval) {
    redirect(`/${locale}/pending-approval`);
  }

  if (sessionUser?.mustChangePassword) {
    redirect(`/${locale}/change-password`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true, plan: true },
  });

  const credits = user?.credits ? Number(user.credits) : 0;
  const plan = user?.plan ?? null;

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
