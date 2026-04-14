'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

import { cn } from '@/lib/utils';
import { TransitivityLogo } from '@/components/brand/TransitivityLogo';
import { PasswordInput } from '@/components/ui/PasswordInput';

const inputBaseClasses =
  'w-full rounded-md border px-4 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f1f]';
const inputNeutralClasses =
  'border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-[#1e3a5f]';
const inputErrorClasses =
  'border-destructive/60 bg-destructive/5 text-destructive placeholder:text-destructive/70 focus-visible:border-destructive focus-visible:ring-destructive/20';

function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-white"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        className="opacity-30"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations('auth');
  const tb = useTranslations('loginBranding');
  const locale = useLocale();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingFields, setPendingFields] = useState({
    fullName: false,
    email: false,
  });

  function getInputClasses(hasError: boolean) {
    return cn(inputBaseClasses, hasError ? inputErrorClasses : inputNeutralClasses);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const payload = {
      email: formData.get('email'),
      fullName: formData.get('fullName'),
      password: formData.get('password'),
    };

    setPendingFields({
      fullName: !String(payload.fullName).trim(),
      email: !String(payload.email).trim(),
    });

    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || t('emailExists'));
    } else if (data?.data?.pendingApproval) {
      router.push(`/${locale}/login?pending=1`);
    } else {
      router.push(`/${locale}/login`);
    }
  }

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Left panel — branding */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#1e3a5f] px-16 py-16 text-white lg:flex lg:w-1/2">
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          aria-hidden="true"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.09), transparent 45%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.08), transparent 40%), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '260px 260px, 320px 320px, 90px 90px, 90px 90px',
          }}
        />
        <div className="relative z-10 max-w-md">
          <TransitivityLogo size="xl" color="#ffffff" className="justify-start" />
        </div>

        <Link
          href={`/${locale}`}
          className="relative z-10 inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
        >
          <span aria-hidden="true">&larr;</span> {tb('backHome')}
        </Link>
      </div>

      {/* Right panel — register form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mb-10 text-center lg:hidden">
          <TransitivityLogo size="md" color="#1e3a5f" className="justify-center" />
        </div>

        <div className="w-full max-w-md rounded-lg border border-border/70 bg-card px-8 py-10 shadow-[0_30px_80px_-65px_rgba(15,23,42,0.65)]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{t('signUp')}</h2>
          </div>

          {error && (
            <p
              className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
              role="alert"
              aria-live="polite"
            >
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5 text-sm">
            <div>
              <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-foreground">
                {t('fullName')}
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                minLength={2}
                autoComplete="name"
                placeholder={locale === 'pt-BR' ? 'Seu nome completo' : 'Your full name'}
                className={getInputClasses(pendingFields.fullName)}
                onChange={() => setPendingFields((prev) => ({ ...prev, fullName: false }))}
                onBlur={(event) => setPendingFields((prev) => ({ ...prev, fullName: !event.target.value.trim() }))}
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                {t('email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@university.edu"
                className={getInputClasses(pendingFields.email)}
                onChange={() => setPendingFields((prev) => ({ ...prev, email: false }))}
                onBlur={(event) => setPendingFields((prev) => ({ ...prev, email: !event.target.value.trim() }))}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
                {t('password')}
              </label>
              <PasswordInput
                id="password"
                name="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder={tb('minChars')}
                className={cn('h-auto', getInputClasses(false))}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#1e3a5f] px-4 py-3 text-sm font-semibold text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1e3a5f] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="inline-flex items-center justify-center gap-2">
                {loading && <LoadingSpinner />}
                <span>{loading ? t('creatingAccount') : t('signUp')}</span>
              </span>
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('hasAccount')}{' '}
            <Link href={`/${locale}/login`} className="font-medium text-[#1e3a5f] underline-offset-2 hover:underline">
              {t('signIn')}
            </Link>
          </p>

          <div className="mt-6 text-center lg:hidden">
            <Link href={`/${locale}`} className="text-sm text-muted-foreground hover:text-foreground">
              &larr; {tb('backHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
