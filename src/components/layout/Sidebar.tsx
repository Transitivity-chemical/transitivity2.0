'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import {
  LayoutDashboard,
  Calculator,
  TrendingUp,
  Atom,
  Brain,
  ChevronLeft,
  ChevronRight,
  Coins,
  MessageCircle,
  Server,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TransitivityLogo, GammaIcon } from '@/components/brand/TransitivityLogo';

export const navItems = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'rateConstant', href: '/rate-constant', icon: Calculator },
  { key: 'fitting', href: '/fitting', icon: TrendingUp },
  { key: 'md', href: '/md', icon: Atom },
  { key: 'ml', href: '/ml', icon: Brain },
  { key: 'assistant', href: '/assistant', icon: MessageCircle },
  { key: 'serverStatus', href: '/server-status', icon: Server },
  { key: 'wiki', href: '/wiki', icon: BookOpen },
] as const;

type Tier = 'FREE' | 'PRO' | 'ENTERPRISE';

const tierMaxCredits: Record<Tier, number | null> = {
  FREE: 50,
  PRO: null,
  ENTERPRISE: null,
};

interface SidebarProps {
  credits?: number;
  tier?: Tier;
}

export function Sidebar({ credits = 0, tier = 'FREE' }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [collapsed, setCollapsed] = useState(false);

  const maxCredits = tierMaxCredits[tier];
  const progressPercent = maxCredits ? Math.min((credits / maxCredits) * 100, 100) : 0;

  return (
    <aside
      className={cn(
        'hidden h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200 md:flex',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-3">
        {!collapsed ? (
          <Link href={`/${locale}/dashboard`}>
            <TransitivityLogo size="md" />
          </Link>
        ) : (
          <Link href={`/${locale}/dashboard`}>
            <GammaIcon size={24} />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1 hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 space-y-2 p-2">
        {navItems.map((item) => {
          const isActive = pathname.includes(item.href);
          const Icon = item.icon;
          const label = t(item.key);

          const link = (
            <Link
              key={item.key}
              href={`/${locale}${item.href}`}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon size={20} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            );
          }

          return link;
        })}
      </nav>

      <div className="border-t p-3">
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-center">
                <Coins size={18} className="text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="text-xs">
                <span className="font-semibold">{tier}</span>
                {maxCredits ? (
                  <span className="ml-1">{credits}/{maxCredits}</span>
                ) : (
                  <span className="ml-1">{tc('credits')}</span>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="space-y-2">
            <span
              className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ backgroundColor: '#1e3a5f', color: '#fff' }}
            >
              {tier}
            </span>

            {maxCredits ? (
              <div className="space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: '#1e3a5f',
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {credits} / {maxCredits} {tc('credits')}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {tc('credits')}: unlimited
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
