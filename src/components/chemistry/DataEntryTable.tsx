'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export interface DataPoint {
  id: string;
  temperature: string;
  rateConstant: string;
}

interface ValidationError {
  rowId: string;
  field: 'temperature' | 'rateConstant';
  message: string;
}

interface DataEntryTableProps {
  points: DataPoint[];
  onChange: (points: DataPoint[]) => void;
  errors?: ValidationError[];
}

let nextId = 1;
function makeId() {
  return `row-${nextId++}-${Date.now()}`;
}

export function createEmptyRow(): DataPoint {
  return { id: makeId(), temperature: '', rateConstant: '' };
}

export function DataEntryTable({ points, onChange, errors = [] }: DataEntryTableProps) {
  const t = useTranslations('fitting');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const updateRow = useCallback(
    (id: string, field: 'temperature' | 'rateConstant', value: string) => {
      onChange(
        points.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
      );
    },
    [points, onChange],
  );

  const addRow = useCallback(() => {
    onChange([...points, createEmptyRow()]);
  }, [points, onChange]);

  const deleteRow = useCallback(
    (id: string) => {
      if (points.length <= 1) return;
      onChange(points.filter((p) => p.id !== id));
    },
    [points, onChange],
  );

  const getError = useCallback(
    (rowId: string, field: 'temperature' | 'rateConstant') => {
      return errors.find((e) => e.rowId === rowId && e.field === field);
    },
    [errors],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const text = e.clipboardData.getData('text/plain');
      if (!text) return;

      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) return; // Not a multi-line paste, let default behavior handle it

      e.preventDefault();

      const newPoints: DataPoint[] = [];
      for (const line of lines) {
        const parts = line.trim().split(/[,;\t]+|\s+/).filter(Boolean);
        if (parts.length >= 2) {
          newPoints.push({
            id: makeId(),
            temperature: parts[0],
            rateConstant: parts[1],
          });
        }
      }

      if (newPoints.length > 0) {
        // Replace empty rows, or append
        const nonEmpty = points.filter(
          (p) => p.temperature.trim() !== '' || p.rateConstant.trim() !== '',
        );
        onChange([...nonEmpty, ...newPoints]);
      }
    },
    [points, onChange],
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadError(null);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/v1/experimental-data/parse', {
          method: 'POST',
          body: formData,
        });

        const json = await res.json();

        if (!res.ok) {
          setUploadError(json.error || 'Failed to parse file');
          return;
        }

        const parsed: DataPoint[] = json.points.map(
          (p: { temperature: number; rateConstant: number }) => ({
            id: makeId(),
            temperature: String(p.temperature),
            rateConstant: String(p.rateConstant),
          }),
        );

        onChange(parsed);
      } catch {
        setUploadError('Failed to upload file');
      }

      // Reset input so same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [onChange],
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={addRow}>
          + {t('addRow')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          {t('uploadFile')}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.dat,.csv"
          className="hidden"
          onChange={handleFileUpload}
        />
        <span className="text-xs text-muted-foreground">
          {t('pasteData')}
        </span>
      </div>

      {uploadError && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {uploadError}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-md border" onPaste={handlePaste}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium w-12">#</th>
              <th className="px-3 py-2 text-left font-medium">
                {t('temperature')} (K)
              </th>
              <th className="px-3 py-2 text-left font-medium">
                {t('rateConstant')} k(T)
              </th>
              <th className="px-3 py-2 text-right font-medium w-16" />
            </tr>
          </thead>
          <tbody>
            {points.map((point, index) => {
              const tempError = getError(point.id, 'temperature');
              const rateError = getError(point.id, 'rateConstant');

              return (
                <tr key={point.id} className="border-b last:border-b-0">
                  <td className="px-3 py-1.5 text-muted-foreground">
                    {index + 1}
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={point.temperature}
                      onChange={(e) =>
                        updateRow(point.id, 'temperature', e.target.value)
                      }
                      placeholder="e.g. 300"
                      className={`w-full rounded-md border px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/30 ${
                        tempError
                          ? 'border-destructive bg-destructive/5'
                          : 'border-input bg-background'
                      }`}
                    />
                    {tempError && (
                      <p className="mt-0.5 text-xs text-destructive">
                        {tempError.message}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={point.rateConstant}
                      onChange={(e) =>
                        updateRow(point.id, 'rateConstant', e.target.value)
                      }
                      placeholder="e.g. 1.5e-12"
                      className={`w-full rounded-md border px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/30 ${
                        rateError
                          ? 'border-destructive bg-destructive/5'
                          : 'border-input bg-background'
                      }`}
                    />
                    {rateError && (
                      <p className="mt-0.5 text-xs text-destructive">
                        {rateError.message}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => deleteRow(point.id)}
                      disabled={points.length <= 1}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      {t('deleteRow')}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Info */}
      <p className="text-xs text-muted-foreground">
        {t('dataPoints')}: {points.length} &middot; {t('minPoints')}
      </p>
    </div>
  );
}
