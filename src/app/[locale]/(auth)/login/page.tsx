'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

import { cn } from '@/lib/utils';
import { TransitivityLogo } from '@/components/brand/TransitivityLogo';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { loginSchema } from '@/lib/validators/auth';

type LoginFormData = {
  email: string;
  password: string;
};

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
        <div className="relative z-10 max-w-md space-y-8">
          <TransitivityLogo size="xl" color="#ffffff" className="justify-start" />
          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/65">{tb('subtitle')}</p>
            <p className="text-2xl font-semibold text-white">{tb('accessPlatform')}</p>
            <p className="text-sm leading-relaxed text-white/80">{tb('createResearch')}</p>
            <p className="text-sm text-white/60">{tb('university')}</p>
          </div>
        </div>

        <Link
          href={`/${locale}`}
          className="relative z-10 inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
        >
          <span aria-hidden="true">&larr;</span> {tb('backHome')}
        </Link>
      </div>

      {/* Right panel — login form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mb-10 text-center lg:hidden">
          <TransitivityLogo size="md" color="#1e3a5f" className="justify-center" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">{tb('subtitle')}</p>
        </div>

        <div className="w-full max-w-md rounded-lg border border-border/70 bg-card px-8 py-10 shadow-[0_30px_80px_-65px_rgba(15,23,42,0.65)]">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">{tb('subtitle')}</p>
            <h1 className="text-2xl font-semibold text-foreground">{t('signIn')}</h1>
            <p className="text-sm text-muted-foreground">{tb('accessPlatform')}</p>
          </div>

          {successMessage && <p className="mt-4 text-sm text-emerald-700">{successMessage}</p>}
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
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
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
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
                className={cn('h-auto', getInputClasses(Boolean(fieldErrors.password)))}
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
              className="w-full rounded-md bg-[#1e3a5f] px-4 py-3 text-sm font-semibold text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1e3a5f] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="inline-flex items-center justify-center gap-2">
                {loading && <LoadingSpinner />}
                <span>{loading ? t('signingIn') : t('signIn')}</span>
              </span>
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <Link href={`/${locale}/register`} className="font-medium text-[#1e3a5f] underline-offset-2 hover:underline">
              {t('register')}
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
