'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

import { cn } from '@/lib/utils';
import { TransitivityLogo, GammaIconRound } from '@/components/brand/TransitivityLogo';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { loginSchema } from '@/lib/validators/auth';

type LoginFormData = {
  email: string;
  password: string;
};

const inputBaseClasses =
  'w-full rounded-lg border px-4 py-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20';
const inputNeutralClasses = 'border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-primary';
const inputErrorClasses =
  'border-destructive/60 bg-destructive/5 text-destructive placeholder:text-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/25';

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

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('auth');
  const tb = useTranslations('loginBranding');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function getInputClasses(hasError: boolean) {
    return cn(inputBaseClasses, hasError ? inputErrorClasses : inputNeutralClasses);
  }

  const successMessage = searchParams.get('reset')
    ? t('passwordResetSuccess')
    : searchParams.get('changed')
      ? t('passwordChangedSuccess')
      : '';

  function validateFields(values: LoginFormData) {
    const result = loginSchema.safeParse(values);

    if (result.success) {
      return {};
    }

    const nextErrors: Partial<Record<keyof LoginFormData, string>> = {};
    const issuesByField = result.error.flatten().fieldErrors;

    if (issuesByField.email?.length) {
      nextErrors.email = values.email.trim() ? t('invalidEmail') : t('emailRequired');
    }

    if (issuesByField.password?.length) {
      nextErrors.password = t('passwordRequired');
    }

    return nextErrors;
  }

  function handleFieldChange(field: keyof LoginFormData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));

    if (fieldErrors[field]) {
      const nextValues = { ...formData, [field]: value };
      setFieldErrors((current) => ({ ...current, ...validateFields(nextValues) }));
    }
  }

  function handleFieldBlur(field: keyof LoginFormData) {
    const validationResult = validateFields(formData);
    setFieldErrors((current) => ({ ...current, [field]: validationResult[field] }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const validationErrors = validateFields(formData);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setLoading(true);
    setFieldErrors({});

    const result = await signIn('credentials', {
      email: formData.email,
      password: formData.password,
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
    <div className="flex min-h-dvh bg-background">
      {/* Left panel — branding */}
      <div className="relative hidden flex-col justify-center overflow-hidden bg-[#1e3a5f] px-16 py-20 text-white lg:flex lg:w-1/2">
        <div
          className="pointer-events-none absolute inset-0 opacity-45"
          aria-hidden="true"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '90px 90px',
          }}
        />
        <div className="relative z-10 max-w-md text-left">
          <TransitivityLogo size="xl" color="#ffffff" className="justify-start" />
          <p className="mt-4 text-[11px] uppercase tracking-[0.45em] text-white/60">{tb('subtitle')}</p>
          <p className="mt-6 text-[13px] leading-relaxed text-white/85">{tb('accessPlatform')}</p>

          <div className="mt-12 space-y-6">
            <div className="rounded-lg border border-white/15 bg-white/5 p-5 text-[13px] leading-relaxed backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <GammaIconRound size={48} bgColor="rgba(255,255,255,0.12)" iconColor="#ffffff" />
                <div className="text-[13px]">
                  <p className="font-semibold text-white">{tb('university')}</p>
                  <p className="mt-1 text-white/70">{tb('subtitle')}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-5 text-[13px] leading-relaxed backdrop-blur-sm">
              <p className="font-semibold text-white">{tb('accessPlatform')}</p>
              <p className="mt-2 text-white/70">{tb('createResearch')}</p>
            </div>
          </div>

          <Link
            href={`/${locale}`}
            className="mt-12 inline-flex items-center gap-2 text-[13px] font-medium text-white/70 transition-colors hover:text-white"
          >
            <span aria-hidden="true">&larr;</span> {tb('backHome')}
          </Link>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mb-10 text-center lg:hidden">
          <GammaIconRound size={64} />
          <h1 className="mt-3">
            <TransitivityLogo size="md" color="#1e3a5f" className="justify-center" />
          </h1>
        </div>

        <div className="w-full max-w-md rounded-lg border border-border/70 bg-card/80 px-8 py-10 shadow-[0_25px_70px_-50px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="inline-flex items-center gap-2 rounded-md border border-border/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            <span className="h-1 w-1 rounded-sm bg-emerald-400" aria-hidden="true" />
            {tb('subtitle')}
          </div>

          {successMessage && <p className="mt-4 text-sm text-green-700">{successMessage}</p>}
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          {error && (
            <p
              className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-[13px] font-medium text-destructive"
              role="alert"
              aria-live="polite"
            >
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-[13px] font-medium text-foreground">
                {t('email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@university.edu"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                onBlur={() => handleFieldBlur('email')}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                className={getInputClasses(Boolean(fieldErrors.email))}
              />
              {fieldErrors.email && (
                <p id="email-error" className="mt-2 text-[11px] font-medium text-destructive">
                  {fieldErrors.email}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-[13px] font-medium text-foreground">
                {t('password')}
              </label>
              <PasswordInput
                id="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                onBlur={() => handleFieldBlur('password')}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                className={cn(
                  'h-auto',
                  fieldErrors.password
                    ? 'border-destructive/60 bg-destructive/5 text-destructive placeholder:text-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/25'
                    : 'focus-visible:border-primary',
                )}
              />
              {fieldErrors.password && (
                <p id="password-error" className="mt-2 text-[11px] font-medium text-destructive">
                  {fieldErrors.password}
                </p>
              )}
              <div className="mt-3 text-right">
                <Link href={`/${locale}/forgot-password`} className="text-sm font-medium text-[#1e3a5f] hover:underline">
                  {t('forgotPassword')}
                </Link>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#1e3a5f] px-4 py-3 text-[13px] font-semibold text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1e3a5f] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="inline-flex items-center justify-center gap-2">
                {loading && <LoadingSpinner />}
                <span>{loading ? t('signingIn') : t('signIn')}</span>
              </span>
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-muted-foreground">
            {t('noAccount')}{' '}
            <Link href={`/${locale}/register`} className="font-medium text-[#1e3a5f] underline-offset-2 hover:underline">
              {t('register')}
            </Link>
          </p>

          <div className="mt-6 text-center lg:hidden">
            <Link href={`/${locale}`} className="text-[13px] text-muted-foreground hover:text-foreground">
              &larr; {tb('backHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
