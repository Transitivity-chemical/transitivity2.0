'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
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
import { cn } from '@/lib/utils';

/**
 * FIX-14 of post-megaplan audit: notification bell + dropdown.
 *
 * Pattern adapted from docs/audit-campus-notifications.md §3 + §4 + §6.
 *
 * - Polls /api/v1/notifications?limit=1 every 30s for unread count
 * - Click → dropdown shows latest 20
 * - Per-type icon mapping (TYPE_ICONS)
 * - Click on notification: marks as read, navigates to link if present
 * - 'Marcar todas como lidas' button
 * - 'Ver todas' link to /notifications page
 * - Outside click closes dropdown
 */

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  metadata?: unknown;
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

function timeAgo(iso: string, locale: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'agora';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString(locale);
}

export function NotificationBell() {
  const router = useRouter();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/notifications?limit=1');
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.unreadCount || 0);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/notifications?limit=20');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial + poll every 30s
  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, 30_000);
    return () => clearInterval(id);
  }, [fetchUnread]);

  // Load full list when dropdown opens
  useEffect(() => {
    if (open) fetchAll();
  }, [open, fetchAll]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAsRead = async (ids: string[]) => {
    await fetch('/api/v1/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationIds: ids }),
    }).catch(() => {});
    setNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n)));
    fetchUnread();
  };

  const markAllRead = async () => {
    await fetch('/api/v1/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    }).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await markAsRead([notif.id]);
    }
    if (notif.link) {
      const href = notif.link.startsWith('/') ? `/${locale}${notif.link}` : notif.link;
      setOpen(false);
      router.push(href);
    }
  };

  return (
    <div ref={bellRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-2 hover:bg-accent"
        aria-label="Notificações"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-1rem)] rounded-lg border bg-popover shadow-lg z-50">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-primary hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Carregando...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma notificação ainda
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
                        'px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors',
                        !n.isRead && 'bg-primary/5',
                      )}
                      onClick={() => handleClick(n)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('rounded-md p-1.5 flex-shrink-0', colorCls)}>
                          <Icon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm', !n.isRead && 'font-semibold')}>{n.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {timeAgo(n.createdAt, locale)}
                          </p>
                        </div>
                        {!n.isRead && (
                          <span className="mt-1 size-2 flex-shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t px-4 py-2 text-center">
            <Link
              href={`/${locale}/notifications`}
              onClick={() => setOpen(false)}
              className="text-xs text-primary hover:underline"
            >
              Ver todas
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
