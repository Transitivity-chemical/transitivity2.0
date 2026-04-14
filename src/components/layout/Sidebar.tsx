'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Atom,
  BarChart3,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  CreditCard,
  FlaskConical,
  Folder,
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

type NavLeaf = {
  key: string;
  href: string;
  icon: typeof Activity;
  adminOnly: boolean;
  children?: undefined;
};

type NavBranch = {
  key: string;
  href: string;
  icon: typeof Activity;
  adminOnly: boolean;
  children: NavLeaf[];
};

type NavItem = NavLeaf | NavBranch;

export const navItems: NavItem[] = [
  { key: 'dashboard', href: '/dashboard', icon: Activity, adminOnly: false },
  {
    key: 'rateConstant',
    href: '/rate-constant',
    icon: FlaskConical,
    adminOnly: false,
    children: [
      { key: 'rateConstantCtst', href: '/rate-constant/ctst', icon: FlaskConical, adminOnly: false },
      { key: 'rateConstantMarcus', href: '/rate-constant/marcus', icon: FlaskConical, adminOnly: false },
    ],
  },
  {
    key: 'md',
    href: '/md',
    icon: Atom,
    adminOnly: false,
    children: [
      { key: 'mdSingle', href: '/md/single', icon: Atom, adminOnly: false },
      { key: 'mdMulti', href: '/md/multi', icon: Atom, adminOnly: false },
    ],
  },
  {
    key: 'fitting',
    href: '/fitting',
    icon: TrendingUp,
    adminOnly: false,
    children: [
      { key: 'fittingArrhenius', href: '/fitting/arrhenius', icon: TrendingUp, adminOnly: false },
      { key: 'fittingTransitivity', href: '/fitting/transitivity', icon: TrendingUp, adminOnly: false },
    ],
  },
  { key: 'history', href: '/history', icon: Clock, adminOnly: false },
  { key: 'files', href: '/files', icon: Folder, adminOnly: false },
  { key: 'assistant', href: '/assistant', icon: Sparkles, adminOnly: false },
  { key: 'wiki', href: '/wiki', icon: BookOpen, adminOnly: false },
  { key: 'plans', href: '/plans', icon: CreditCard, adminOnly: false },
  { key: 'settings', href: '/settings', icon: SettingsIcon, adminOnly: false },
  { key: 'adminUsers', href: '/admin/users', icon: UsersRound, adminOnly: true },
  { key: 'adminAnalytics', href: '/admin/analytics', icon: BarChart3, adminOnly: true },
];

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

  // Tracks which branch nav items are currently expanded. Persisted to
  // localStorage so the state survives route changes + refreshes.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sidebar-expanded');
      if (raw) setExpanded(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);
  const toggleExpanded = (key: string) => {
    setExpanded((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('sidebar-expanded', JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    });
  };

  // Auto-expand any branch whose current route matches one of its children.
  const autoExpanded = useMemo(() => {
    const map: Record<string, boolean> = { ...expanded };
    for (const item of visibleNavItems) {
      if (!item.children) continue;
      const active = item.children.some((c) => pathname.includes(`/${locale}${c.href}`));
      if (active) map[item.key] = true;
    }
    return map;
  }, [expanded, visibleNavItems, pathname, locale]);

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

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const label = t(item.key);
          const isBranch = !!item.children;
          const isExactActive = pathname === `/${locale}${item.href}`;
          const hasActiveChild = isBranch && item.children!.some((c) => pathname.includes(`/${locale}${c.href}`));
          const isActive = isExactActive || (!isBranch && pathname.includes(`/${locale}${item.href}`));
          const open = autoExpanded[item.key] ?? false;

          if (collapsed) {
            // Collapsed mode: no tree, just icon links (parent only)
            return (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>
                  <Link
                    href={`/${locale}${item.href}`}
                    className={cn(
                      'flex items-center justify-center rounded-md p-2.5 transition-colors',
                      isActive || hasActiveChild
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    )}
                  >
                    <Icon size={20} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            );
          }

          // Expanded mode
          return (
            <div key={item.key}>
              <div
                className={cn(
                  'group flex items-center rounded-md text-sm font-medium transition-colors',
                  (isActive || hasActiveChild) && !isBranch && 'bg-primary text-primary-foreground',
                  !isActive && !isBranch && 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  hasActiveChild && isBranch && 'text-foreground',
                  !hasActiveChild && isBranch && 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Link
                  href={`/${locale}${item.href}`}
                  className="flex flex-1 items-center gap-3 px-3 py-2.5"
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
                {isBranch && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleExpanded(item.key);
                    }}
                    className="mr-2 rounded p-1 hover:bg-background/20"
                    aria-label={open ? 'Collapse' : 'Expand'}
                    aria-expanded={open}
                  >
                    <ChevronDown
                      size={14}
                      className={cn('transition-transform duration-200 motion-reduce:transition-none', open ? 'rotate-0' : '-rotate-90')}
                    />
                  </button>
                )}
              </div>

              {isBranch && (
                <div
                  className={cn(
                    'grid overflow-hidden transition-all duration-200 motion-reduce:transition-none',
                    open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="min-h-0">
                    {/*
                      File-explorer style tree. The vertical trunk drops from
                      the parent icon center (16px from the row left edge ≈
                      `left-[22px]`) and each child draws an L-elbow into its
                      label. The trunk stops at the midpoint of the last
                      child row via a tall gradient mask so the bottom child
                      doesn't get a dangling line.
                    */}
                    <ul className="relative mt-1.5 mb-1 space-y-1 pl-[22px]">
                      {/* vertical trunk */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-[22px] top-0 w-px bg-sidebar-accent"
                        style={{ height: `calc(100% - 1.1rem)` }}
                      />
                      {item.children!.map((child, idx) => {
                        const childActive = pathname === `/${locale}${child.href}`;
                        const isLast = idx === item.children!.length - 1;
                        return (
                          <li key={child.key} className="relative">
                            {/* horizontal elbow */}
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute left-0 top-[18px] h-px w-3 bg-sidebar-accent"
                            />
                            {/* mask the trunk after the last child */}
                            {isLast && (
                              <span
                                aria-hidden="true"
                                className="pointer-events-none absolute -left-[1px] top-[18px] bottom-0 w-[2px] bg-sidebar"
                              />
                            )}
                            <Link
                              href={`/${locale}${child.href}`}
                              className={cn(
                                'relative ml-3 flex items-center gap-2 rounded-md py-2 pl-2.5 pr-3 text-[13px] transition-colors',
                                childActive
                                  ? 'bg-primary/10 font-medium text-primary'
                                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                              )}
                            >
                              {t(child.key)}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
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
