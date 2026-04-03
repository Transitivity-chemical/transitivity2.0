'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { LogOut, Sun, Moon, Settings, User, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { navItems } from '@/components/layout/Sidebar';
import { GammaIcon } from '@/components/brand/TransitivityLogo';

export function Header() {
  const { data: session } = useSession();
  const t = useTranslations('nav');
  const locale = useLocale();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;

    const stored = localStorage.getItem('theme');
    return stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

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
    <>
      <header className="flex h-14 items-center justify-between border-b bg-background px-3 sm:px-4">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-md p-2 hover:bg-accent md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>

          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-2 text-sm font-semibold text-foreground md:hidden"
          >
            <GammaIcon size={22} />
            <span className="truncate">Transitivity</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />

          <button
            onClick={toggleTheme}
            className="rounded-md p-2 hover:bg-accent"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

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
              <div className="px-2 py-1.5">
                {session?.user?.name && (
                  <p className="text-sm font-medium">{session.user.name}</p>
                )}
                {session?.user?.email && (
                  <p className="text-xs text-muted-foreground">{session.user.email}</p>
                )}
              </div>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href={`/${locale}/settings`} className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  {t('profile') ?? 'Profile'}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href={`/${locale}/settings`} className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  {t('settings') ?? 'Settings'}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                {t('signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[86vw] max-w-xs border-r p-0 md:hidden">
          <SheetHeader className="border-b px-4 py-4 text-left">
            <SheetTitle className="flex items-center gap-2 text-base">
              <GammaIcon size={22} />
              <span>Transitivity</span>
            </SheetTitle>
            {(session?.user?.name || session?.user?.email) && (
              <div className="space-y-0.5 pt-2">
                {session?.user?.name && <p className="text-sm font-medium">{session.user.name}</p>}
                {session?.user?.email && <p className="text-xs text-muted-foreground">{session.user.email}</p>}
              </div>
            )}
          </SheetHeader>

          <div className="flex h-full flex-col">
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.key}
                    href={`/${locale}${item.href}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-accent"
                  >
                    <Icon size={18} />
                    <span>{t(item.key)}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t px-3 py-4">
              <div className="space-y-1">
                <Link
                  href={`/${locale}/settings`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-accent"
                >
                  <User size={18} />
                  <span>{t('profile') ?? 'Profile'}</span>
                </Link>

                <Link
                  href={`/${locale}/settings`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-accent"
                >
                  <Settings size={18} />
                  <span>{t('settings') ?? 'Settings'}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium hover:bg-accent"
                >
                  <LogOut size={18} />
                  <span>{t('signOut')}</span>
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
