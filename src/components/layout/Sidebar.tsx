'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import {
  Activity,
  Atom,
  Bell,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  CreditCard,
  FlaskConical,
  Sparkles,
  Settings2 as SettingsIcon,
  TrendingUp,
  BookOpen,
  UsersRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TransitivityLogo, GammaIcon } from '@/components/brand/TransitivityLogo';
import { isAdminRole } from '@/lib/access';
import { PlansModal } from '@/components/plans/PlansModal';

export const navItems = [
  { key: 'dashboard', href: '/dashboard', icon: Activity, adminOnly: false },
  { key: 'rateConstant', href: '/rate-constant', icon: FlaskConical, adminOnly: false },
  { key: 'md', href: '/md', icon: Atom, adminOnly: false },
  { key: 'fitting', href: '/fitting', icon: TrendingUp, adminOnly: false },
  { key: 'history', href: '/history', icon: Clock, adminOnly: false },
  { key: 'assistant', href: '/assistant', icon: Sparkles, adminOnly: false },
  { key: 'wiki', href: '/wiki', icon: BookOpen, adminOnly: false },
  { key: 'plans', href: '/plans', icon: CreditCard, adminOnly: false },
  { key: 'settings', href: '/settings', icon: SettingsIcon, adminOnly: false },
  { key: 'adminUsers', href: '/admin/users', icon: UsersRound, adminOnly: true },
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
  role?: string | null;
  plan?: string | null;
}

export function Sidebar({ credits = 0, tier = 'FREE', role, plan }: SidebarProps) {
  // plan is the new field from User.plan; tier is legacy and will be removed in Phase 9
  // For now, derive tier-equivalent display from plan if present
  const displayTier = plan === 'PROFESSIONAL' ? 'PRO' : plan === 'ENTERPRISE' ? 'ENTERPRISE' : tier;
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [collapsed, setCollapsed] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);

  const maxCredits = tierMaxCredits[displayTier];
  const progressPercent = maxCredits ? Math.min((credits / maxCredits) * 100, 100) : 0;
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdminRole(role));

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
        {visibleNavItems.map((item) => {
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
        <button
          type="button"
          onClick={() => setShowPlansModal(true)}
          className="w-full text-left rounded-md p-1 hover:bg-sidebar-accent transition-colors"
          aria-label="Open plans"
        >
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <Coins size={18} className="text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="text-xs">
                  <span className="font-semibold">{displayTier}</span>
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
                className="inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: '#1e3a5f', color: '#fff' }}
              >
                {displayTier}
              </span>

              {maxCredits ? (
                <div className="space-y-1">
                  <div className="h-2 w-full overflow-hidden rounded-sm bg-muted">
                    <div
                      className="h-full rounded-sm transition-all duration-300"
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
        </button>
      </div>
      <PlansModal
        open={showPlansModal}
        onClose={() => setShowPlansModal(false)}
        locale={locale}
        currentPlan={(plan as 'STUDENT' | 'PROFESSIONAL' | 'ENTERPRISE' | null) ?? null}
        credits={credits}
      />
    </aside>
  );
}
