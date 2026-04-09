'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { signOut } from 'next-auth/react';
import { GammaIconRound } from '@/components/brand/TransitivityLogo';
import { PasswordInput } from '@/components/ui/PasswordInput';

/**
 * Forced first-login password change page.
 *
 * Phase 5 of megaplan. Users with mustChangePassword=true are redirected here
 * by dashboard layout. They cannot reach any other page until they set a new
 * password.
 */
export default function ChangePasswordPage() {
  const t = useTranslations('changePassword');
  const tc = useTranslations('common');
  const router = useRouter();
  const locale = useLocale();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const currentPassword = String(fd.get('currentPassword') ?? '');
    const newPassword = String(fd.get('newPassword') ?? '');
    const confirmPassword = String(fd.get('confirmPassword') ?? '');

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

    const res = await fetch('/api/v1/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    setLoading(false);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data?.error || t('wrongCurrent'));
      return;
    }

    // Force a session refresh by signing out and redirecting to login.
    // The new login will pick up mustChangePassword=false from the DB.
    await signOut({ redirect: false });
    router.push(`/${locale}/login?changed=1`);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <div className="text-center">
          <GammaIconRound size={56} />
          <h1 className="mt-5 text-2xl font-semibold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-sm text-gray-600">{t('description')}</p>
        </div>

        {error && <p className="mt-6 text-sm text-red-600 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('currentPassword')}</label>
            <PasswordInput
              name="currentPassword"
              required
              autoComplete="current-password"
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm h-auto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('newPassword')}</label>
            <PasswordInput
              name="newPassword"
              required
              minLength={8}
              autoComplete="new-password"
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm h-auto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('confirmPassword')}</label>
            <PasswordInput
              name="confirmPassword"
              required
              minLength={8}
              autoComplete="new-password"
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm h-auto"
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
      </div>
    </div>
  );
}
