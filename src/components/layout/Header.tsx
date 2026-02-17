'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { LogOut, Sun, Moon, Settings, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

export function Header() {
  const { data: session } = useSession();
  const t = useTranslations('nav');
  const locale = useLocale();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const initials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      {/* Left side - reserved for breadcrumbs */}
      <div />

      {/* Right side */}
      <div className="flex items-center gap-3">
        <LanguageSwitcher />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-md p-2 hover:bg-accent"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md p-1 hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* User info */}
            <div className="px-2 py-1.5">
              {session?.user?.name && (
                <p className="text-sm font-medium">{session.user.name}</p>
              )}
              {session?.user?.email && (
                <p className="text-xs text-muted-foreground">{session.user.email}</p>
              )}
            </div>
            <DropdownMenuSeparator />

            {/* Profile */}
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/settings`} className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                {t('profile') ?? 'Profile'}
              </Link>
            </DropdownMenuItem>

            {/* Settings */}
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/settings`} className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                {t('settings') ?? 'Settings'}
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Sign Out */}
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              {t('signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
