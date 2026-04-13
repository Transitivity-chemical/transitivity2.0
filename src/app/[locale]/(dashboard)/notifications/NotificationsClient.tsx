'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Coins,
  Users,
  Settings as SettingsIcon,
  Sparkles,
  CheckCircle,
  UserPlus,
  PartyPopper,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

const TYPE_ICONS: Record<string, typeof Bell> = {
  CALC_COMPLETED: CheckCircle2,
  CALC_FAILED: XCircle,
  CREDITS_LOW: Coins,
  TEAM_INVITE: Users,
  SYSTEM: SettingsIcon,
  PLAN_UPGRADE_REQUEST: Sparkles,
  PLAN_CHANGED: CheckCircle,
  USER_REGISTERED: UserPlus,
  ACCOUNT_APPROVED: CheckCircle,
  WELCOME: PartyPopper,
};

const TYPE_COLORS: Record<string, string> = {
  CALC_COMPLETED: 'text-green-600 bg-green-50 dark:bg-green-950/40',
  CALC_FAILED: 'text-red-600 bg-red-50 dark:bg-red-950/40',
  CREDITS_LOW: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
  TEAM_INVITE: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',
  SYSTEM: 'text-muted-foreground bg-muted',
  PLAN_UPGRADE_REQUEST: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40',
  PLAN_CHANGED: 'text-green-600 bg-green-50 dark:bg-green-950/40',
  USER_REGISTERED: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',
  ACCOUNT_APPROVED: 'text-green-600 bg-green-50 dark:bg-green-950/40',
  WELCOME: 'text-primary bg-primary/10',
};

interface Props {
  locale: string;
  initial: Notification[];
}

export function NotificationsClient({ locale, initial }: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initial);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredNotifications =
    filter === 'all' ? notifications : notifications.filter((n) => !n.isRead);

  const markAsRead = async (ids: string[]) => {
    await fetch('/api/v1/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationIds: ids }),
    }).catch(() => {});
    setNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n)));
  };

  const markAllRead = async () => {
    await fetch('/api/v1/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    }).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClick = async (notif: Notification) => {
    if (!notif.isRead) await markAsRead([notif.id]);
    if (notif.link) {
      const href = notif.link.startsWith('/') ? `/${locale}${notif.link}` : notif.link;
      router.push(href);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <Bell className="size-6" aria-hidden />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia ✓'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="motion-reduce:transition-none"
        >
          Marcar todas como lidas
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b border-border/70 pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-muted-foreground">
                Central de alertas
              </CardTitle>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-border/70 px-3 py-1 text-muted-foreground">
                  Total: {notifications.length}
                </span>
                <span className="rounded-full border border-border/70 px-3 py-1 text-muted-foreground">
                  Novas: {unreadCount}
                </span>
              </div>
            </div>
            <div className="inline-flex rounded-full border border-border/70 bg-background/80 p-0.5">
              {([
                { key: 'all', label: 'Todas' },
                { key: 'unread', label: 'Não lidas' },
              ] as const).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setFilter(option.key)}
                  aria-pressed={filter === option.key}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition motion-reduce:transition-none',
                    filter === option.key
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Bell className="mx-auto mb-3 size-10 opacity-30" aria-hidden />
              <p className="text-sm">Você ainda não tem notificações.</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Bell className="mx-auto mb-3 size-10 opacity-30" aria-hidden />
              <p className="text-sm">Nada a exibir neste filtro.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {filteredNotifications.map((n) => {
                const Icon = TYPE_ICONS[n.type] || Bell;
                const colorCls = TYPE_COLORS[n.type] || 'text-muted-foreground bg-muted';
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleClick(n)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-lg px-4 py-4 text-left transition hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 motion-reduce:transition-none',
                        !n.isRead ? 'bg-primary/5' : 'bg-transparent',
                      )}
                      aria-label={`Abrir ${n.title}`}
                    >
                      <div className={cn('rounded-lg p-2 flex-shrink-0', colorCls)}>
                        <Icon className="size-5" aria-hidden />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className={cn('text-sm', !n.isRead && 'font-semibold text-foreground')}>
                            {n.title}
                          </p>
                          <time className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(n.createdAt).toLocaleString(locale)}
                          </time>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                      </div>
                      {!n.isRead && (
                        <span className="mt-1.5 size-2 flex-shrink-0 rounded-full bg-primary" aria-hidden />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
