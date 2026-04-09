'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PlansClient, type PlanConfig } from './PlansClient';

/**
 * Phase 8 of megaplan: Plans modal triggered by clicking the credits bar.
 *
 * Reference: docs/audit-questionpunk.md §5 (full-screen with fade/scale 150ms)
 */
interface Props {
  open: boolean;
  onClose: () => void;
  locale: string;
  currentPlan: 'STUDENT' | 'PROFESSIONAL' | 'ENTERPRISE' | null;
  credits: number;
}

export function PlansModal({ open, onClose, locale, currentPlan, credits }: Props) {
  const [planConfigs, setPlanConfigs] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/v1/plans')
      .then((r) => r.json())
      .then((data) => {
        setPlanConfigs(data.plans || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Carregando...</div>
        ) : (
          <PlansClient
            locale={locale}
            planConfigs={planConfigs}
            currentPlan={currentPlan}
            credits={credits}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
