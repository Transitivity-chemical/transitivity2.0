'use client';

import { signOut } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { GammaIconRound } from '@/components/brand/TransitivityLogo';

/**
 * Page shown to users whose registration is pending admin approval.
 *
 * They land here after registering with an email domain not in the allowlist.
 * No app access until an admin promotes them.
 *
 * Phase 4 of megaplan.
 */
export default function PendingApprovalPage() {
  const t = useTranslations('pendingApproval');
  const locale = useLocale();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm text-center">
        <GammaIconRound size={64} />
        <h1 className="mt-6 text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t('description')}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t('hint')}</p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
          className="mt-8 rounded-lg bg-[#1e3a5f] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          {t('signOut')}
        </button>
      </div>
    </div>
  );
}
