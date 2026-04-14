'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Check, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * FIX-12 of post-megaplan audit: Anthropic-style plans page.
 *
 * - Card grid with the user's current plan highlighted with a 'Plano atual' badge
 * - Higher tiers show 'Solicitar upgrade'
 * - Lower tiers show 'Solicitar downgrade'
 * - Same-tier (current) shows nothing/disabled
 * - Featured plan (PROFESSIONAL) gets a subtle accent
 */

export type PlanConfig = {
  plan: 'STUDENT' | 'PROFESSIONAL' | 'ENTERPRISE';
  maxCredits: number | null;
  monthlyCredits: number | null;
  label: string;
  labelEn: string | null;
  description: string | null;
  descriptionEn: string | null;
};

interface Props {
  locale: string;
  planConfigs: PlanConfig[];
  currentPlan: 'STUDENT' | 'PROFESSIONAL' | 'ENTERPRISE' | null;
  credits: number;
}

const PLAN_RANK: Record<string, number> = {
  STUDENT: 1,
  PROFESSIONAL: 2,
  ENTERPRISE: 3,
};

export function PlansClient({ locale, planConfigs, currentPlan, credits }: Props) {
  const t = useTranslations('plans');
  const [requesting, setRequesting] = useState<string | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());

  const currentRank = currentPlan ? PLAN_RANK[currentPlan] : 0;

  const handleRequest = async (targetPlan: string) => {
    setRequesting(targetPlan);
    try {
      const res = await fetch('/api/v1/plans/request-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPlan }),
      });
      if (res.ok) {
        setRequested((prev) => new Set([...prev, targetPlan]));
      }
    } finally {
      setRequesting(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
        {currentPlan && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border bg-muted/30 px-4 py-1.5 text-sm">
            <Crown className="h-3.5 w-3.5 text-amber-500" />
            <span>
              {t('youreOn')} <strong>{labelFor(currentPlan)}</strong> · {credits.toLocaleString(locale)} {t('credits')}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        {planConfigs.map((cfg) => {
          const targetRank = PLAN_RANK[cfg.plan];
          const isCurrent = currentPlan === cfg.plan;
          const isHigher = targetRank > currentRank;
          const isLower = targetRank < currentRank && currentRank > 0;
          const isFeatured = cfg.plan === 'PROFESSIONAL';

          const features = featuresFor(cfg.plan, t);

          let actionLabel: string;
          let actionDisabled = false;
          let actionVariant: 'default' | 'outline' | 'secondary' = 'default';
          if (isCurrent) {
            actionLabel = t('currentPlanBadge');
            actionDisabled = true;
            actionVariant = 'secondary';
          } else if (requested.has(cfg.plan)) {
            actionLabel = t('requestSent');
            actionDisabled = true;
            actionVariant = 'outline';
          } else if (isHigher) {
            actionLabel = t('requestUpgrade');
          } else if (isLower) {
            actionLabel = t('requestDowngrade');
            actionVariant = 'outline';
          } else {
            actionLabel = t('requestUpgrade');
          }

          return (
            <div
              key={cfg.plan}
              className={cn(
                'relative rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md',
                isFeatured && 'border-primary/40 shadow-lg shadow-primary/5',
                isCurrent && 'ring-2 ring-primary',
              )}
            >
              {isFeatured && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                    Mais popular
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                    Plano atual
                  </span>
                </div>
              )}

              <div className="mb-1 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {locale === 'pt-BR' ? cfg.label : cfg.labelEn || cfg.label}
              </div>
              <div className="mb-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">
                  {cfg.maxCredits ?? '∞'}
                </span>
                <span className="text-sm text-muted-foreground">{t('creditsPerMonth')}</span>
              </div>
              <p className="mb-6 text-sm text-muted-foreground min-h-[2.5rem]">
                {locale === 'pt-BR' ? cfg.description : cfg.descriptionEn || cfg.description}
              </p>

              <Button
                className="w-full"
                variant={actionVariant}
                disabled={actionDisabled || requesting !== null}
                onClick={() => handleRequest(cfg.plan)}
              >
                {requesting === cfg.plan ? t('requesting') : actionLabel}
              </Button>

              <div className="my-6 border-t" />

              <ul className="space-y-3 text-sm">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Mudanças de plano são processadas manualmente por um administrador. Você receberá uma notificação quando aprovado.
      </p>
    </div>
  );
}

function labelFor(plan: 'STUDENT' | 'PROFESSIONAL' | 'ENTERPRISE'): string {
  return { STUDENT: 'Estudante', PROFESSIONAL: 'Profissional', ENTERPRISE: 'Empresarial' }[plan];
}

function featuresFor(plan: string, t: (k: string) => string): string[] {
  if (plan === 'STUDENT') {
    return [
      t('feat.gsaFitting'),
      t('feat.tstRate'),
      t('feat.assistant'),
      t('feat.wiki'),
    ];
  }
  if (plan === 'PROFESSIONAL') {
    return [
      t('feat.allStudent'),
      t('feat.cpmd'),
      t('feat.fittingHistory'),
      t('feat.priority'),
    ];
  }
  return [
    t('feat.allPro'),
    t('feat.unlimited'),
    t('feat.multiInputs'),
    t('feat.dedicatedSupport'),
  ];
}
