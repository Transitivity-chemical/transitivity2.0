'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { GammaIconRound } from '@/components/brand/TransitivityLogo';
import { PasswordInput } from '@/components/ui/PasswordInput';

export default function ResetPasswordPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('resetPassword');
  const [tokenState, setTokenState] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = searchParams.get('token') ?? '';

  useEffect(() => {
    let active = true;

    async function validateToken() {
      if (!token) {
        setTokenState('invalid');
        return;
      }

      const response = await fetch(`/api/v1/auth/reset-password?token=${encodeURIComponent(token)}`);
      const data = await response.json().catch(() => ({ valid: false }));

      if (active) {
        setTokenState(data.valid ? 'valid' : 'invalid');
      }
    }

    void validateToken();

    return () => {
      active = false;
    };
  }, [token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get('newPassword') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    if (newPassword.length < 8) {
      setError(t('minLength'));
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('mismatch'));
      setLoading(false);
      return;
    }

    const response = await fetch('/api/v1/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });

    setLoading(false);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data?.error || t('invalidToken'));
      return;
    }

    router.push(`/${locale}/login?reset=1`);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="text-center">
          <GammaIconRound size={56} />
          <h1 className="mt-5 text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        {tokenState === 'checking' ? (
          <div className="mt-8 rounded-xl border border-border bg-muted/30 px-4 py-4 text-center text-sm text-muted-foreground">
            {t('submitting')}
          </div>
        ) : tokenState === 'invalid' ? (
          <div className="mt-8 space-y-5">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive">
              {t('invalidToken')}
            </div>
            <Link
              href={`/${locale}/forgot-password`}
              className="block w-full rounded-lg bg-[#1e3a5f] px-4 py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t('requestAnother')}
            </Link>
          </div>
        ) : (
          <>
            {error && <p className="mt-6 text-center text-sm text-red-600">{error}</p>}
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t('newPassword')}</label>
                <PasswordInput
                  name="newPassword"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-auto rounded-lg border border-input px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t('confirmPassword')}</label>
                <PasswordInput
                  name="confirmPassword"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-auto rounded-lg border border-input px-4 py-2.5 text-sm"
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
          </>
        )}
      </div>
    </div>
  );
}
