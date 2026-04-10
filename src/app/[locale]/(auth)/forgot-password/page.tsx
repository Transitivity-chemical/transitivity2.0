'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { GammaIconRound } from '@/components/brand/TransitivityLogo';

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
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="text-center">
          <GammaIconRound size={56} />
          <h1 className="mt-5 text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        {submitted ? (
          <div className="mt-8 space-y-5">
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 text-sm">
              <p className="font-medium text-foreground">{t('successTitle')}</p>
              <p className="mt-2 text-muted-foreground">{t('successDescription')}</p>
            </div>
            <Link
              href={`/${locale}/login`}
              className="block w-full rounded-lg bg-[#1e3a5f] px-4 py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
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
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? t('submitting') : t('submit')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href={`/${locale}/login`} className="text-sm text-gray-500 hover:text-gray-700">
                &larr; {t('backToLogin')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
