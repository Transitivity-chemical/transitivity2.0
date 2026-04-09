'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Check, Sparkles } from 'lucide-react';

/**
 * Phase 8 of megaplan: Plans cards client component.
 *
 * Used both as the /plans page body AND inside the PlansModal.
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

export function PlansClient({ locale, planConfigs, currentPlan, credits }: Props) {
  const t = useTranslations('plans');
  const [requesting, setRequesting] = useState<string | null>(null);

  const handleRequest = async (targetPlan: string) => {
    if (currentPlan === targetPlan) return;
    setRequesting(targetPlan);
    try {
      const res = await fetch('/api/v1/plans/request-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPlan }),
      });
      if (res.ok) {
        alert(t('requestSent'));
      } else {
        const data = await res.json();
        alert(data.error || 'Erro');
      }
    } finally {
      setRequesting(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-amber-500 mb-3" />
        <h1 className="text-3xl font-semibold">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
        {currentPlan && (
          <p className="mt-3 text-sm">
            {t('youreOn')} <strong>{currentPlan}</strong> · {credits} {t('credits')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planConfigs.map((cfg) => {
          const isCurrent = currentPlan === cfg.plan;
          const features = (() => {
            if (cfg.plan === 'STUDENT') return [t('feat.gsaFitting'), t('feat.tstRate'), t('feat.assistant'), t('feat.wiki')];
            if (cfg.plan === 'PROFESSIONAL') return [t('feat.allStudent'), t('feat.cpmd'), t('feat.fittingHistory'), t('feat.priority')];
            return [t('feat.allPro'), t('feat.unlimited'), t('feat.multiInputs'), t('feat.dedicatedSupport')];
          })();
          return (
            <Card key={cfg.plan} className={isCurrent ? 'border-primary border-2' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{locale === 'pt-BR' ? cfg.label : cfg.labelEn || cfg.label}</CardTitle>
                  {isCurrent && (
                    <span className="text-xs font-semibold rounded-full bg-primary px-2 py-0.5 text-primary-foreground">
                      {t('current')}
                    </span>
                  )}
                </div>
                <CardDescription>
                  {locale === 'pt-BR' ? cfg.description : cfg.descriptionEn || cfg.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="text-3xl font-bold">
                    {cfg.maxCredits ?? '∞'}
                    <span className="text-sm font-normal text-muted-foreground"> {t('creditsPerMonth')}</span>
                  </div>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={isCurrent ? 'secondary' : 'default'}
                  disabled={isCurrent || requesting !== null}
                  onClick={() => handleRequest(cfg.plan)}
                >
                  {isCurrent ? t('current') : requesting === cfg.plan ? t('requesting') : t('requestUpgrade')}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
