'use client';

/**
 * Three action buttons for Fitting tabs: Open file, Save, Fitting.
 *
 * Reference: docs/audit-tkinter-fitting.md
 *            docs/tabs-rebuild-impeccable-plan.md Phase 1.6
 */

import { useRef } from 'react';
import { FolderOpen, Save, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { TKPair } from './TemperatureRateColumns';

export interface FittingFileButtonsProps {
  onOpenFile: (pairs: TKPair[]) => void;
  onSave: () => void;
  onFit: () => void;
  fitting?: boolean;
  canSave?: boolean;
  className?: string;
}

function parseTwoColumn(text: string): TKPair[] {
  const out: TKPair[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;
    const parts = line.split(/[\s,;\t]+/);
    if (parts.length < 2) continue;
    const T = parseFloat(parts[0]);
    const k = parseFloat(parts[1]);
    if (Number.isNaN(T) || Number.isNaN(k)) continue;
    out.push({ T, k });
  }
  return out;
}

export function FittingFileButtons({
  onOpenFile,
  onSave,
  onFit,
  fitting = false,
  canSave = false,
  className,
}: FittingFileButtonsProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const pairs = parseTwoColumn(text);
    if (pairs.length === 0) {
      toast.error(`Não foi possível ler ${file.name}`, {
        description: 'Esperado: 2 colunas (T, k) separadas por espaço, vírgula ou tab',
      });
      return;
    }
    onOpenFile(pairs);
    toast.success(`${pairs.length} pontos carregados de ${file.name}`);
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.csv,.dat,.tsv"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
          <FolderOpen className="mr-1.5 h-4 w-4" />
          Open file · Abrir arquivo
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onSave}
          disabled={!canSave}
        >
          <Save className="mr-1.5 h-4 w-4" />
          Save · Salvar
        </Button>
        <Button
          type="button"
          onClick={onFit}
          disabled={fitting}
        >
          {fitting ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Fitting… · Ajustando…
            </>
          ) : (
            <>
              <Sparkles className="mr-1.5 h-4 w-4" />
              Fitting · Ajustar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
