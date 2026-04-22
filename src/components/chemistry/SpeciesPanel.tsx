'use client';

/**
 * Species panel — file upload + parsed energy display + optional energy override.
 * Used in Rate Constant CTST (5 panels) and Marcus Theory (6 panels).
 *
 * Reference: docs/audit-tkinter-rate.md §"Conventional TST" species panels
 *            docs/tabs-rebuild-impeccable-plan.md Phase 1.2
 */

import { useState } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { HoverPreviewPopover } from '@/components/common/HoverPreviewPopover';
import { TransitionStatePreview } from '@/components/chemistry/previews';
import { FilePicker, type BucketFile } from '@/components/files/FilePicker';
import { formatEnergy } from '@/lib/format-scientific';

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
  const [parsing, setParsing] = useState(false);
  const [overrideEnabled, setOverrideEnabled] = useState(energyOverride !== null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const parseBucketFile = async (file: BucketFile) => {
    setParsing(true);
    try {
      const res = await fetch('/api/v1/files/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUploadId: file.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      const data = json.data ?? json;
      onChange({ filename: file.originalName, ...data });
      toast.success(`${label}: ${file.originalName} carregado`);
    } catch (e) {
      toast.error(`${label}: falha ao analisar`, { description: String(e) });
    } finally {
      setParsing(false);
    }
  };

  const clearFile = () => {
    onChange(null);
  };

  const isTS = /transition state/i.test(label);

  return (
    <div className={cn('rounded-md border bg-card p-3 space-y-2 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
          {required && <span className="ml-1 text-red-500" aria-label="Obrigatório · Required">*</span>}
          {isTS && (
            <HoverPreviewPopover
              preview={TransitionStatePreview}
              title="Transition state"
              description="Saddle point on the reaction coordinate. Exactly one imaginary frequency; ΔG‡ sets the TST rate constant."
            />
          )}
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
              SCF: {formatEnergy(value.scfEnergy)} Eh
            </div>
          )}
          {value.nAtoms != null && (
            <div className="text-[10px] text-muted-foreground">
              {value.nAtoms} átomos · {value.geometryType ?? 'nonlinear'}
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={parsing}
          onClick={() => setPickerOpen(true)}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-input cursor-pointer py-3 text-center transition-colors',
            'hover:border-primary hover:bg-accent/30',
            parsing && 'pointer-events-none opacity-50',
          )}
        >
          {parsing ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-[10px] text-muted-foreground">
            Escolher da galeria · Pick from gallery
          </span>
        </button>
      )}

      <FilePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(f) => parseBucketFile(f)}
        accept={['.log', '.out', '.gjf', '.com', '.xyz']}
        title={`${label}: escolher arquivo`}
        description="Escolha um arquivo já enviado ou clique em Enviar para adicionar um novo."
      />

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
