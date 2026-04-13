'use client';

/**
 * Species panel — file upload + parsed energy display + optional energy override.
 * Used in Rate Constant CTST (5 panels) and Marcus Theory (6 panels).
 *
 * Reference: docs/audit-tkinter-rate.md §"Conventional TST" species panels
 *            docs/tabs-rebuild-impeccable-plan.md Phase 1.2
 */

import { useRef, useState } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface ParsedSpecies {
  filename: string;
  scfEnergy?: number | null;
  electronicPlusEnthalpy?: number | null;
  electronicPlusFreeEnergy?: number | null;
  molecularMassKg?: number;
  vibrationalTemps?: number[];
  rotationalTemps?: number[];
  imaginaryFreq?: number | null;
  multiplicity?: number;
  rotationalSymmetryNumber?: number;
  geometryType?: 'atom' | 'linear' | 'nonlinear';
  atomComposition?: Record<string, number>;
  nAtoms?: number;
}

export interface SpeciesPanelProps {
  label: string;
  value: ParsedSpecies | null;
  onChange: (species: ParsedSpecies | null) => void;
  /** Show "Set Energy (a.u)" checkbox + override field. CTST: true. Marcus: false. */
  allowEnergyOverride?: boolean;
  /** Override SCF energy in atomic units (Hartree) when checkbox is active. */
  energyOverride?: number | null;
  onEnergyOverrideChange?: (value: number | null) => void;
  /** Required indicator. */
  required?: boolean;
  className?: string;
}

export function SpeciesPanel({
  label,
  value,
  onChange,
  allowEnergyOverride = true,
  energyOverride = null,
  onEnergyOverrideChange,
  required = false,
  className,
}: SpeciesPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [overrideEnabled, setOverrideEnabled] = useState(energyOverride !== null);

  const handleFile = async (file: File) => {
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/v1/files/parse', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = json.data ?? json;
      onChange({ filename: file.name, ...data });
      toast.success(`${label}: ${file.name} carregado`);
    } catch (e) {
      toast.error(`${label}: falha ao analisar`, { description: String(e) });
    } finally {
      setParsing(false);
    }
  };

  const clearFile = () => {
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={cn('rounded-md border bg-card p-3 space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
          {required && <span className="ml-1 text-red-500" aria-label="Obrigatório · Required">*</span>}
        </div>
        {value && (
          <button
            type="button"
            onClick={clearFile}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Remover arquivo · Remove file"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {value ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs">
            <FileText className="h-3 w-3 text-primary flex-shrink-0" />
            <span className="font-mono truncate" title={value.filename}>
              {value.filename}
            </span>
          </div>
          {value.scfEnergy != null && (
            <div className="text-[10px] text-muted-foreground tabular-nums">
              SCF: {value.scfEnergy.toFixed(6)} Eh
            </div>
          )}
          {value.nAtoms != null && (
            <div className="text-[10px] text-muted-foreground">
              {value.nAtoms} átomos · {value.geometryType ?? 'nonlinear'}
            </div>
          )}
        </div>
      ) : (
        <label
          className={cn(
            'flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-input cursor-pointer py-3 text-center transition-colors',
            'hover:border-primary hover:bg-accent/30',
            parsing && 'pointer-events-none opacity-50',
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".log,.out,.gjf,.com,.xyz"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            disabled={parsing}
          />
          {parsing ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-[10px] text-muted-foreground">Selecionar .log/.out · Select .log/.out</span>
        </label>
      )}

      {allowEnergyOverride && (
        <div className="space-y-1 pt-1">
          <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
            <input
              type="checkbox"
              checked={overrideEnabled}
              onChange={(e) => {
                const next = e.target.checked;
                setOverrideEnabled(next);
                if (!next) onEnergyOverrideChange?.(null);
              }}
              className="accent-primary"
            />
            <span>Set Energy (a.u) · Definir energia (u.a)</span>
          </label>
          {overrideEnabled && (
            <Input
              type="number"
              step="0.000001"
              value={energyOverride ?? ''}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                onEnergyOverrideChange?.(Number.isNaN(v) ? null : v);
              }}
              placeholder="-76.408953"
              className="h-7 text-[11px] font-mono"
            />
          )}
        </div>
      )}
    </div>
  );
}
