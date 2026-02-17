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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true },
  });

  const credits = user?.credits ? Number(user.credits) : 0;

  return (
    <SessionProvider>
      <TooltipProvider>
        <DashboardShell credits={credits}>{children}</DashboardShell>
      </TooltipProvider>
    </SessionProvider>
  );
}
