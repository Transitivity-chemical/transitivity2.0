'use client';

/**
 * GSA hyperparameters fieldset (qA, qT, qV, NStopMax, To, F).
 * Used in Fitting Arrhenius Plot and Transitivity Plot sub-tabs.
 *
 * Reference: docs/audit-tkinter-fitting.md GSA Parameters fieldset
 *            docs/tabs-rebuild-impeccable-plan.md Phase 1.4
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface GsaParams {
  qA: number;
  qT: number;
  qV: number;
  NStopMax: number;
  To: number;
  F: number;
}

export const DEFAULT_GSA_PARAMS: GsaParams = {
  qA: 1.1,
  qT: 1.5,
  qV: 1.1,
  NStopMax: 10000,
  To: 1.0,
  F: 1,
};

const FIELDS: { key: keyof GsaParams; label: string; step: string }[] = [
  { key: 'qA', label: '(qA) — Acceptance index', step: '0.1' },
  { key: 'qT', label: '(qT) — Temperature index', step: '0.1' },
  { key: 'qV', label: '(qV) — Visiting index', step: '0.1' },
  { key: 'NStopMax', label: '(NStopMax) — Max number of GSA-loops', step: '100' },
  { key: 'To', label: '(To) — Initial Temperature', step: '0.1' },
  { key: 'F', label: '(F) — Factor', step: '0.1' },
];

export interface GsaParamsFieldsetProps {
  value: GsaParams;
  onChange: (params: GsaParams) => void;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

export function GsaParamsFieldset({
  value,
  onChange,
  collapsible = true,
  defaultCollapsed = false,
  className,
}: GsaParamsFieldsetProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const update = (key: keyof GsaParams, raw: string) => {
    const v = key === 'NStopMax' ? parseInt(raw, 10) : parseFloat(raw);
    if (!Number.isNaN(v)) onChange({ ...value, [key]: v });
  };

  return (
    <fieldset className={cn('rounded-md border bg-card p-3', className)}>
      <legend className="px-1 -ml-1">
        {collapsible ? (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            GSA Parameters · Parâmetros GSA
          </button>
        ) : (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            GSA Parameters · Parâmetros GSA
          </span>
        )}
      </legend>

      {!collapsed && (
        <div className="mt-2 space-y-2">
          {FIELDS.map((f) => {
            const inputId = `gsa-${f.key}`;
            const labelId = `${inputId}-label`;
            return (
              <div key={f.key} className="flex items-center gap-2">
                <Input
                  id={inputId}
                  type="number"
                  step={f.step}
                  value={value[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                  className="h-7 w-24 text-[11px] font-mono"
                  aria-labelledby={labelId}
                />
                <label id={labelId} htmlFor={inputId} className="text-[11px] text-muted-foreground">
                  {f.label}
                </label>
              </div>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
