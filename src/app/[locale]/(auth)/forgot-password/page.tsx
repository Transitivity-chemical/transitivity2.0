'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { TransitivityLogo } from '@/components/brand/TransitivityLogo';

const inputClasses =
  'w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f1f]';

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const t = useTranslations('forgotPasswordPage');
  const tAuth = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/v1/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, locale }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.error || tAuth('invalidEmail'));
      return;
    }

    setSubmitted(true);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md rounded-lg border border-border/70 bg-card px-8 py-10 shadow-[0_30px_80px_-65px_rgba(15,23,42,0.65)]">
        <div className="text-center">
          <TransitivityLogo size="md" color="#1e3a5f" className="justify-center" />
          <h1 className="mt-5 text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        {submitted ? (
          <div className="mt-8 space-y-5">
            <div className="rounded-md border border-primary/25 bg-primary/5 px-4 py-4 text-sm">
              <p className="font-medium text-foreground">{t('successTitle')}</p>
              <p className="mt-2 text-muted-foreground">{t('successDescription')}</p>
            </div>
            <Link
              href={`/${locale}/login`}
              className="block w-full rounded-md bg-[#1e3a5f] px-4 py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t('backToLogin')}
            </Link>
          </div>
        ) : (
          <>
            {error && <p className="mt-6 text-center text-sm text-red-600">{error}</p>}
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                  {tAuth('email')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClasses}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? t('submitting') : t('submit')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href={`/${locale}/login`} className="text-sm text-muted-foreground hover:text-foreground">
                &larr; {t('backToLogin')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
