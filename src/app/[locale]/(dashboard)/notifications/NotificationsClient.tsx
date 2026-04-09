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
  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Notificações</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              Marcar todas como lidas
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Bell className="mx-auto mb-3 size-10 opacity-30" />
              <p className="text-sm">Você ainda não tem notificações.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => {
                const Icon = TYPE_ICONS[n.type] || Bell;
                const colorCls = TYPE_COLORS[n.type] || 'text-muted-foreground bg-muted';
                return (
                  <li
                    key={n.id}
                    className={cn(
                      'py-4 hover:bg-accent/30 cursor-pointer transition-colors -mx-6 px-6',
                      !n.isRead && 'bg-primary/5',
                    )}
                    onClick={() => handleClick(n)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('rounded-md p-2 flex-shrink-0', colorCls)}>
                        <Icon className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn('text-sm', !n.isRead && 'font-semibold')}>{n.title}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(n.createdAt).toLocaleString(locale)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                      </div>
                      {!n.isRead && (
                        <span className="mt-1.5 size-2 flex-shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
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
