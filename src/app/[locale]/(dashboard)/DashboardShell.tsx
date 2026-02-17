'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { FloatingChat } from '@/components/chat/FloatingChat';

interface DashboardShellProps {
  children: React.ReactNode;
  credits: number;
}

export function DashboardShell({ children, credits }: DashboardShellProps) {
  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <Sidebar credits={credits} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
      <FloatingChat />
    </>
  );
}
