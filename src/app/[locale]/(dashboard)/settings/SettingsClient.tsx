'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon } from 'lucide-react';

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

  // Sync tab to URL via shallow replace
  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (params.get('tab') !== tab) {
      params.set('tab', tab);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [tab, router, searchParams]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
          <SettingsIcon className="size-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">Gerencie sua conta, plano, preferências e atividade.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList>
          <TabsTrigger value="profile">{t('profile')}</TabsTrigger>
          <TabsTrigger value="billing">{t('billing')}</TabsTrigger>
          <TabsTrigger value="preferences">{t('preferences')}</TabsTrigger>
          <TabsTrigger value="activity">{t('activity')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t('name')}</p>
                  <p className="font-medium">{user.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('role')}</p>
                  <Badge variant="outline">{user.role}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('plan')}</p>
                  <Badge variant="outline">{user.plan ?? '—'}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('memberSince')}</p>
                  <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                {user.institution && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t('institution')}</p>
                    <p className="font-medium">{user.institution}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('creditsRemaining')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">
                  {parseFloat(user.credits).toFixed(0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('currentPlan')}: {user.plan ?? '—'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('usageHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                {usageRecords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('noUsage')}</p>
                ) : (
                  <div className="space-y-2">
                    {usageRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between border-b border-muted/50 py-2 text-sm"
                      >
                        <div>
                          <span className="font-medium">{record.operation.replace(/_/g, ' ')}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {new Date(record.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <span className="font-mono text-xs">
                          -{parseFloat(record.tokensUsed).toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>{t('preferences')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-medium mb-1">{t('themeLabel')}</p>
                <p className="text-xs text-muted-foreground mb-2">{t('themeHint')}</p>
                <div className="flex gap-2">
                  <ThemeOption value="light" label={t('themeLight')} />
                  <ThemeOption value="dark" label={t('themeDark')} />
                  <ThemeOption value="system" label={t('themeSystem')} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">{t('languageLabel')}</p>
                <p className="text-xs text-muted-foreground">{t('languageHint')}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">{t('notificationsLabel')}</p>
                <p className="text-xs text-muted-foreground">{t('notificationsHint')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>{t('activity')}</CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noActivity')}</p>
              ) : (
                <div className="space-y-2">
                  {activity.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between border-b border-muted/50 py-2 text-sm"
                    >
                      <div>
                        <Badge variant="outline" className="mr-2">{row.type}</Badge>
                        <span className="font-medium">{row.name || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{row.status}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(row.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ThemeOption({ value, label }: { value: 'light' | 'dark' | 'system'; label: string }) {
  const apply = () => {
    if (value === 'system') {
      localStorage.removeItem('theme');
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', dark);
    } else {
      localStorage.setItem('theme', value);
      document.documentElement.classList.toggle('dark', value === 'dark');
    }
  };
  return (
    <button
      type="button"
      onClick={apply}
      className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
    >
      {label}
    </button>
  );
}
