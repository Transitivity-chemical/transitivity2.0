'use client';

/**
 * Initial Parameters fieldset with per-row Lock checkbox.
 * Rows derived from theory → params map.
 *
 * Reference: docs/audit-tkinter-fitting.md Initial Parameters
 *            docs/tabs-rebuild-impeccable-plan.md Phase 1.5
 */

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ParamSpec } from '@/lib/fitting-theory-config';

export interface InitialParamValue {
  value: number;
  locked: boolean;
}

export interface InitialParamsFieldsetProps {
  /** Param specs derived from the active theory. */
  params: ParamSpec[];
  /** Map of param key → { value, locked }. */
  values: Record<string, InitialParamValue>;
  onChange: (key: string, value: InitialParamValue) => void;
  className?: string;
}

export function InitialParamsFieldset({ params, values, onChange, className }: InitialParamsFieldsetProps) {
  return (
    <fieldset className={cn('rounded-lg border bg-card p-3 shadow-sm', className)}>
      <legend className="px-1 -ml-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Initial Parameters · Parâmetros Iniciais
      </legend>

      <div className="mt-2 space-y-1.5">
        {params.map((p) => {
          const v = values[p.key] ?? { value: p.default, locked: false };
          const inputId = `param-${p.key}`;
          const lockId = `${inputId}-lock`;
          return (
            <div key={p.key} className="flex items-center gap-2">
              <label
                htmlFor={inputId}
                className="w-6 text-right text-xs font-mono text-muted-foreground cursor-pointer"
              >
                {p.label}
              </label>
              <Input
                id={inputId}
                type="number"
                step="0.001"
                value={v.value}
                onChange={(e) => {
                  const num = parseFloat(e.target.value);
                  if (!Number.isNaN(num)) onChange(p.key, { ...v, value: num });
                }}
                className="h-7 flex-1 text-[11px] font-mono"
              />
              <label htmlFor={lockId} className="flex items-center gap-1 text-[11px] cursor-pointer">
                <input
                  id={lockId}
                  type="checkbox"
                  checked={v.locked}
                  onChange={(e) => onChange(p.key, { ...v, locked: e.target.checked })}
                  className="accent-primary"
                />
                <span>Lock · Fixar</span>
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
