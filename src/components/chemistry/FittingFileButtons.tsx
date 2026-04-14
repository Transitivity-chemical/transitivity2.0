'use client';

/**
 * Three action buttons for Fitting tabs: Open file, Save, Fitting.
 * Open file now opens the FilePicker gallery modal first (progressive
 * disclosure): user sees their previously uploaded datasets + can upload
 * new ones inline from the same dialog.
 *
 * Reference: docs/audit-tkinter-fitting.md
 *            docs/tabs-rebuild-impeccable-plan.md Phase 1.6
 */

import { useState } from 'react';
import { FolderOpen, Save, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { TKPair } from './TemperatureRateColumns';
import { FilePicker, type BucketFile } from '@/components/files/FilePicker';

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
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleBucketFile = async (file: BucketFile) => {
    try {
      const res = await fetch(`/api/v1/files/${file.id}/download`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const pairs = parseTwoColumn(text);
      if (pairs.length === 0) {
        toast.error(`Não foi possível ler ${file.originalName}`, {
          description: 'Esperado: 2 colunas (T, k) separadas por espaço, vírgula ou tab',
        });
        return;
      }
      onOpenFile(pairs);
      toast.success(`${pairs.length} pontos carregados de ${file.originalName}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao baixar');
    }
  };

  return (
    <div className={className}>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
          <FolderOpen className="mr-1.5 h-4 w-4" />
          Open file · Abrir arquivo
        </Button>
        <Button type="button" variant="outline" onClick={onSave} disabled={!canSave}>
          <Save className="mr-1.5 h-4 w-4" />
          Save · Salvar
        </Button>
        <Button type="button" onClick={onFit} disabled={fitting}>
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

      <FilePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleBucketFile}
        accept={['.txt', '.csv', '.dat', '.tsv']}
        title="Abrir dataset de fitting"
        description="Escolha um arquivo já enviado ou clique em Enviar para adicionar um novo."
      />
    </div>
  );
}
