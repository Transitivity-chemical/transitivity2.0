'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  plan: string | null;
  credits: string;
  institution?: string;
  isInstitutional: boolean;
  createdAt: string;
}

interface UsageRecord {
  id: string;
  operation: string;
  tokensUsed: string;
  createdAt: string;
}

interface ActivityRow {
  id: string;
  type: string;
  name: string;
  status: string;
  createdAt: string;
}

const VALID_TABS = ['profile', 'billing', 'preferences', 'activity'] as const;
type TabKey = (typeof VALID_TABS)[number];
type ThemeValue = 'light' | 'dark' | 'system';

export function SettingsClient({
  user,
  usageRecords,
  activity,
}: {
  user: User;
  usageRecords: UsageRecord[];
  activity: ActivityRow[];
}) {
  const t = useTranslations('settings');
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'profile';
  const [tab, setTab] = useState<TabKey>(VALID_TABS.includes(initialTab) ? initialTab : 'profile');
  const [themePreference, setThemePreference] = useState<ThemeValue>('system');

  // Sync tab to URL via shallow replace
  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (params.get('tab') !== tab) {
      params.set('tab', tab);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [tab, router, searchParams]);

  // Read current theme from localStorage / DOM to reflect it in the UI.
  // DO NOT re-apply it to the DOM — the Header owns the theme class and has
  // already set it before this component mounts, so touching it here causes
  // a flash from light → dark when landing on /settings.
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      setThemePreference(stored);
    } else {
      setThemePreference('system');
    }
  }, []);

  const applyThemePreference = (value: ThemeValue) => {
    setThemePreference(value);
    if (value === 'system') {
      localStorage.removeItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
      return;
    }
    localStorage.setItem('theme', value);
    document.documentElement.classList.toggle('dark', value === 'dark');
  };

  const createdAt = new Date(user.createdAt);
  const relativeJoined = (() => {
    const diffDays = Math.floor((Date.now() - createdAt.getTime()) / 86400000);
    if (diffDays <= 0) return 'Hoje';
    if (diffDays === 1) return 'Há 1 dia';
    if (diffDays < 30) return `Há ${diffDays} dias`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return 'Há 1 mês';
    if (diffMonths < 12) return `Há ${diffMonths} meses`;
    const diffYears = Math.floor(diffMonths / 12);
    return `Há ${diffYears} ano${diffYears > 1 ? 's' : ''}`;
  })();
  const latestUsage = usageRecords[0]?.createdAt ? new Date(usageRecords[0].createdAt) : null;
  const summary = [
    {
      key: 'plan',
      label: t('plan'),
      value: user.plan ?? '—',
      meta: user.isInstitutional ? 'Conta institucional UnB' : 'Conta individual',
    },
    {
      key: 'credits',
      label: t('creditsRemaining'),
      value: parseFloat(user.credits).toFixed(0),
      meta: latestUsage
        ? `Última execução ${latestUsage.toLocaleString()}`
        : 'Sem execuções registradas',
    },
    {
      key: 'member',
      label: t('memberSince'),
      value: createdAt.toLocaleDateString(),
      meta: relativeJoined,
    },
  ] as const;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg border border-slate-200/70 bg-white/90 shadow-sm p-2 text-primary dark:border-slate-800 dark:bg-slate-900">
          <SettingsIcon className="size-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">Gerencie sua conta, plano, preferências e atividade.</p>
        </div>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        {summary.map((item) => (
          <div
            key={item.key}
            className="rounded-lg border border-slate-200/70 bg-white/95 shadow-sm p-4 dark:border-slate-800 dark:bg-slate-950"
          >
            <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{item.label}</dt>
            <dd className="text-2xl font-semibold text-foreground">{item.value}</dd>
            <p className="text-xs text-muted-foreground">{item.meta}</p>
          </div>
        ))}
      </dl>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="space-y-4">
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto border-b border-border/70 bg-transparent p-0 pb-2 motion-reduce:transition-none"
          aria-label="Configurações"
        >
          <TabsTrigger value="profile" className="min-w-[120px] rounded-lg px-3 py-2">
            {t('profile')}
          </TabsTrigger>
          <TabsTrigger value="billing" className="min-w-[120px] rounded-lg px-3 py-2">
            {t('billing')}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="min-w-[140px] rounded-lg px-3 py-2">
            {t('preferences')}
          </TabsTrigger>
          <TabsTrigger value="activity" className="min-w-[120px] rounded-lg px-3 py-2">
            {t('activity')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <section className="rounded-lg border border-slate-200/70 bg-white/95 shadow-sm p-5 dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-lg font-semibold tracking-tight">{t('profile')}</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200/70 bg-white/90 shadow-sm p-4 dark:border-slate-800 dark:bg-slate-900">
                <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{t('name')}</dt>
                <dd className="text-base font-medium">{user.fullName}</dd>
              </div>
              <div className="rounded-lg border border-slate-200/70 bg-white/90 shadow-sm p-4 dark:border-slate-800 dark:bg-slate-900">
                <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Email</dt>
                <dd className="text-base font-medium">{user.email}</dd>
              </div>
              <div className="rounded-lg border border-slate-200/70 bg-white/90 shadow-sm p-4 dark:border-slate-800 dark:bg-slate-900">
                <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{t('role')}</dt>
                <dd>
                  <Badge variant="outline">{user.role}</Badge>
                </dd>
              </div>
              <div className="rounded-lg border border-slate-200/70 bg-white/90 shadow-sm p-4 dark:border-slate-800 dark:bg-slate-900">
                <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{t('plan')}</dt>
                <dd>
                  <Badge variant="outline">{user.plan ?? '—'}</Badge>
                </dd>
              </div>
              <div className="rounded-lg border border-slate-200/70 bg-white/90 shadow-sm p-4 dark:border-slate-800 dark:bg-slate-900">
                <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{t('memberSince')}</dt>
                <dd className="text-base font-medium">{createdAt.toLocaleDateString()}</dd>
              </div>
              {user.institution && (
                <div className="rounded-lg border border-slate-200/70 bg-white/90 shadow-sm p-4 dark:border-slate-800 dark:bg-slate-900">
                  <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{t('institution')}</dt>
                  <dd className="text-base font-medium">{user.institution}</dd>
                </div>
              )}
            </dl>
          </section>
        </TabsContent>

        <TabsContent value="billing">
          <div className="space-y-4">
            <section className="rounded-lg border border-slate-200/70 bg-white/95 shadow-sm p-5 dark:border-slate-800 dark:bg-slate-950">
              <h2 className="text-lg font-semibold tracking-tight">{t('creditsRemaining')}</h2>
              <p className="mt-3 text-4xl font-bold text-primary">{parseFloat(user.credits).toFixed(0)}</p>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {t('currentPlan')}: {user.plan ?? '—'}
              </p>
            </section>

            <section className="rounded-lg border border-slate-200/70 bg-white/95 shadow-sm p-5 dark:border-slate-800 dark:bg-slate-950">
              <h2 className="text-lg font-semibold tracking-tight">{t('usageHistory')}</h2>
              {usageRecords.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">{t('noUsage')}</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm" aria-live="polite">
                  {usageRecords.map((record) => (
                    <li
                      key={record.id}
                      className="flex items-center justify-between border-b border-border/60 py-2"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{record.operation.replace(/_/g, ' ')}</span>
                        <time className="text-xs text-muted-foreground">
                          {new Date(record.createdAt).toLocaleString()}
                        </time>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        -{parseFloat(record.tokensUsed).toFixed(1)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <section className="rounded-lg border border-slate-200/70 bg-white/95 shadow-sm p-5 dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-lg font-semibold tracking-tight">{t('preferences')}</h2>
            <div className="mt-4 space-y-6">
              <div>
                <p className="mb-1 text-sm font-medium">{t('themeLabel')}</p>
                <p className="mb-2 text-xs text-muted-foreground">{t('themeHint')}</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <ThemeOption
                    value="light"
                    label={t('themeLight')}
                    selected={themePreference === 'light'}
                    onSelect={applyThemePreference}
                  />
                  <ThemeOption
                    value="dark"
                    label={t('themeDark')}
                    selected={themePreference === 'dark'}
                    onSelect={applyThemePreference}
                  />
                  <ThemeOption
                    value="system"
                    label={t('themeSystem')}
                    selected={themePreference === 'system'}
                    onSelect={applyThemePreference}
                  />
                </div>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium">{t('languageLabel')}</p>
                <p className="text-xs text-muted-foreground">{t('languageHint')}</p>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium">{t('notificationsLabel')}</p>
                <p className="text-xs text-muted-foreground">{t('notificationsHint')}</p>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="activity">
          <section className="rounded-lg border border-slate-200/70 bg-white/95 shadow-sm p-5 dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-lg font-semibold tracking-tight">{t('activity')}</h2>
            {activity.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t('noActivity')}</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {activity.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between border-b border-border/60 py-2"
                  >
                    <div>
                      <Badge variant="outline" className="mr-2">
                        {row.type}
                      </Badge>
                      <span className="font-medium">{row.name || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{row.status}</Badge>
                      <time className="text-xs text-muted-foreground">
                        {new Date(row.createdAt).toLocaleString()}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ThemeOption({
  value,
  label,
  selected,
  onSelect,
}: {
  value: ThemeValue;
  label: string;
  selected: boolean;
  onSelect: (value: ThemeValue) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={selected}
      className={cn(
        'rounded-md border px-3 py-2 text-left text-sm transition hover:border-primary/40 hover:bg-primary/5 motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900',
        selected ? 'border-primary bg-primary/10 text-foreground' : 'border-slate-200/70 bg-white text-muted-foreground dark:text-muted-foreground',
      )}
    >
      <span className="font-medium">{label}</span>
      <p className="text-xs text-muted-foreground">{selected ? 'Ativo' : 'Aplicar'}</p>
    </button>
  );
}
