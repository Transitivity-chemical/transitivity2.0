'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { FloatingChat } from '@/components/chat/FloatingChat';

interface DashboardShellProps {
  children: React.ReactNode;
  credits: number;
  role?: string | null;
}

export function DashboardShell({ children, credits, role }: DashboardShellProps) {
  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <Sidebar credits={credits} role={role} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header role={role} />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
      <FloatingChat />
    </>
  );
}
