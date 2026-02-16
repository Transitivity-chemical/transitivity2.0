'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { TransitivityLogo, GammaIcon, GammaIconRound } from '@/components/brand/TransitivityLogo';

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('auth');
  const tb = useTranslations('loginBranding');
  const locale = useLocale();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError(t('invalidCredentials'));
    } else {
      router.push(`/${locale}/dashboard`);
    }
  }

  return (
    <div className="flex min-h-dvh">
      {/* Left panel — branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-[#1e3a5f] px-12 text-white">
        <div className="max-w-sm text-center">
          <GammaIcon size={120} color="#ffffff" className="mx-auto" />

          <p className="mt-6 text-sm text-white/50">{tb('university')}</p>

          <Link href={`/${locale}`} className="mt-8 inline-block text-sm text-white/60 underline underline-offset-2 hover:text-white/80">
            &larr; {tb('backHome')}
          </Link>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mb-8 text-center lg:hidden">
          <GammaIconRound size={64} />
          <h1 className="mt-3">
            <TransitivityLogo size="md" color="#1e3a5f" className="justify-center" />
          </h1>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-gray-900">{t('signIn')}</h2>
          <p className="mt-1 text-sm text-gray-500">{tb('accessPlatform')}</p>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">{t('email')}</label>
              <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@university.edu"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">{t('password')}</label>
              <input id="password" name="password" type="password" required autoComplete="current-password" placeholder="&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
              {loading ? t('signingIn') : t('signIn')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t('noAccount')}{' '}
            <Link href={`/${locale}/register`} className="font-medium text-[#1e3a5f] hover:underline">{t('register')}</Link>
          </p>

          <div className="mt-6 text-center lg:hidden">
            <Link href={`/${locale}`} className="text-sm text-gray-400 hover:text-gray-600">&larr; {tb('backHome')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
