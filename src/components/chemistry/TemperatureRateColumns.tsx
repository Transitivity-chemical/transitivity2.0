'use client';

/**
 * Side-by-side scrollable Temperature (K) + Rate Constant columns.
 * Populated by Open file or manual entry. Used in Fitting both sub-tabs.
 *
 * Reference: docs/audit-tkinter-fitting.md
 *            docs/tabs-rebuild-impeccable-plan.md Phase 1.7
 */

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface TKPair {
  T: number;
  k: number;
}

export interface TemperatureRateColumnsProps {
  value: TKPair[];
  onChange: (pairs: TKPair[]) => void;
  className?: string;
  rateLabel?: string; // bilingual label optional
  height?: string;
}

export function TemperatureRateColumns({
  value,
  onChange,
  className,
  rateLabel = 'Rate Constant · Constante de taxa',
  height = 'h-64',
}: TemperatureRateColumnsProps) {
  const [tText, setTText] = useState(() => value.map((p) => p.T).join('\n'));
  const [kText, setKText] = useState(() => value.map((p) => p.k).join('\n'));
  const lastEmittedRef = useRef<string>('');

  useEffect(() => {
    const serialized = value.map((p) => `${p.T},${p.k}`).join('|');
    if (serialized === lastEmittedRef.current) return;
    lastEmittedRef.current = serialized;
    setTText(value.map((p) => p.T).join('\n'));
    setKText(value.map((p) => p.k).join('\n'));
  }, [value]);

  const sync = (newTText: string, newKText: string) => {
    const Ts = newTText.split(/\n/).map((s) => parseFloat(s.trim())).filter((n) => !Number.isNaN(n));
    const ks = newKText.split(/\n/).map((s) => parseFloat(s.trim())).filter((n) => !Number.isNaN(n));
    const len = Math.min(Ts.length, ks.length);
    const pairs: TKPair[] = [];
    for (let i = 0; i < len; i++) pairs.push({ T: Ts[i], k: ks[i] });
    lastEmittedRef.current = pairs.map((p) => `${p.T},${p.k}`).join('|');
    onChange(pairs);
  };

  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      <div className="space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">
          Temperature (K) · Temperatura (K)
        </div>
        <textarea
          value={tText}
          onChange={(e) => {
            setTText(e.target.value);
            sync(e.target.value, kText);
          }}
          aria-label="Temperaturas em Kelvin · Temperature column"
          className={cn(
            'w-full rounded-md border border-input bg-background px-2 py-1 text-[11px] font-mono outline-none focus:ring-1 focus:ring-primary tabular-nums',
            height,
          )}
        />
      </div>
      <div className="space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">
          {rateLabel}
        </div>
        <textarea
          value={kText}
          onChange={(e) => {
            setKText(e.target.value);
            sync(tText, e.target.value);
          }}
          aria-label="Constante de taxa · Rate constant column"
          className={cn(
            'w-full rounded-md border border-input bg-background px-2 py-1 text-[11px] font-mono outline-none focus:ring-1 focus:ring-primary tabular-nums',
            height,
          )}
        />
      </div>
    </div>
  );
}
