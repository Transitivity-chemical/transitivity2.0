'use client';

/**
 * Temperature configuration for Rate Constant calculation.
 * "Default Temperature Range" checkbox toggles a 25-point list (273-4000 K)
 * vs a custom newline/comma-separated user list.
 *
 * Reference: docs/audit-tkinter-rate.md — Default Temperatures (RateLib.py line 102)
 *            docs/tabs-rebuild-impeccable-plan.md Phase 1.3
 */

import { useState, useEffect, useId } from 'react';
import { cn } from '@/lib/utils';

export const DEFAULT_TEMPERATURES: readonly number[] = [
  273.15, 298.15, 300, 400, 500, 600, 700, 800, 900, 1000,
  1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000,
  3200, 3400, 3600, 3800, 4000,
];

export interface TemperatureConfigProps {
  value: number[];
  onChange: (temps: number[]) => void;
  className?: string;
}

export function TemperatureConfig({ value, onChange, className }: TemperatureConfigProps) {
  const [useDefault, setUseDefault] = useState(true);
  const [customText, setCustomText] = useState('');
  const checkboxId = useId();

  useEffect(() => {
    if (useDefault) {
      onChange([...DEFAULT_TEMPERATURES]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useDefault]);

  const handleCustomChange = (text: string) => {
    setCustomText(text);
    const parsed = text
      .split(/[\n,;\s]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !Number.isNaN(n) && n > 0);
    onChange(parsed);
  };

  return (
    <div className={cn('rounded-md border bg-card p-3 space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Set Temperature · Definir temperatura
        </span>
        <label htmlFor={checkboxId} className="flex items-center gap-1.5 text-xs cursor-pointer">
          <input
            id={checkboxId}
            type="checkbox"
            checked={useDefault}
            onChange={(e) => setUseDefault(e.target.checked)}
            className="accent-primary"
          />
          <span>Default Range · Faixa padrão</span>
        </label>
      </div>

      {useDefault ? (
        <div className="rounded border bg-muted/30 px-2 py-1.5 text-[10px] font-mono text-muted-foreground tabular-nums max-h-32 overflow-y-auto">
          {DEFAULT_TEMPERATURES.length} points · {DEFAULT_TEMPERATURES[0]}–{DEFAULT_TEMPERATURES[DEFAULT_TEMPERATURES.length - 1]} K
          <div className="mt-1 leading-relaxed">{DEFAULT_TEMPERATURES.join(', ')}</div>
        </div>
      ) : (
        <textarea
          value={customText}
          onChange={(e) => handleCustomChange(e.target.value)}
          rows={6}
          placeholder="300&#10;400&#10;500&#10;…"
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-[11px] font-mono outline-none focus:ring-1 focus:ring-primary"
          aria-label="Temperaturas personalizadas · Custom temperatures"
        />
      )}

      <div className="text-[10px] text-muted-foreground tabular-nums" aria-live="polite">
        {value.length} temperaturas selecionadas
      </div>
    </div>
  );
}
