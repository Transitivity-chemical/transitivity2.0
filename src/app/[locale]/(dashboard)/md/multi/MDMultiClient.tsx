'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Download, Upload, FileText, X, Layers } from 'lucide-react';

/**
 * Phase 14B of megaplan: Multiple Inputs MD wizard.
 *
 * Reference: docs/audit-tkinter-md-multi.md §B
 *           docs/transitivity-overhaul-plan.md Phase 14B
 */

type Atom = { element: string; x: number; y: number; z: number };

function parseGjf(text: string): Atom[] {
  // Tolerant Gaussian .gjf parser: skip header (# / chk / blank / title / blank / charge spin)
  // then read lines like 'C 0.0 0.0 0.0' until blank
  const lines = text.split(/\r?\n/);
  const atoms: Atom[] = [];
  // Find the line after charge/multiplicity (e.g. "0 1")
  let started = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!started) {
      if (/^-?\d+\s+\d+$/.test(line)) {
        started = true;
      }
      continue;
    }
    if (!line) break;
    const parts = line.split(/\s+/);
    if (parts.length < 4) break;
    const [el, x, y, z] = parts;
    if (Number.isNaN(parseFloat(x))) break;
    atoms.push({ element: el, x: parseFloat(x), y: parseFloat(y), z: parseFloat(z) });
  }
  return atoms;
}

function parseXyz(text: string): Atom[] {
  const lines = text.trim().split(/\r?\n/);
  const n = parseInt(lines[0]?.trim() ?? '', 10);
  if (Number.isNaN(n)) return [];
  const atoms: Atom[] = [];
  for (let i = 2; i < 2 + n && i < lines.length; i++) {
    const parts = lines[i].trim().split(/\s+/);
    if (parts.length < 4) continue;
    atoms.push({
      element: parts[0],
      x: parseFloat(parts[1]),
      y: parseFloat(parts[2]),
      z: parseFloat(parts[3]),
    });
  }
  return atoms;
}

export function MDMultiClient() {
  const [mol1, setMol1] = useState<Atom[]>([]);
  const [mol2, setMol2] = useState<Atom[]>([]);
  const [mol1Name, setMol1Name] = useState('');
  const [mol2Name, setMol2Name] = useState('');

  const [bondMin, setBondMin] = useState(5);
  const [bondMax, setBondMax] = useState(5);
  const [bondSteps, setBondSteps] = useState(1);
  const [angleMin, setAngleMin] = useState(0);
  const [angleMax, setAngleMax] = useState(360);
  const [angleSteps, setAngleSteps] = useState(1);
  const [dihedralMin, setDihedralMin] = useState(0);
  const [dihedralMax, setDihedralMax] = useState(360);
  const [dihedralSteps, setDihedralSteps] = useState(1);
  const [tempMin, setTempMin] = useState(300);
  const [tempMax, setTempMax] = useState(300);
  const [tempSteps, setTempSteps] = useState(1);
  const [addChiral, setAddChiral] = useState(false);
  const [dynamicsType, setDynamicsType] = useState('CPMD');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    files: { filename: string; content: string; type: string }[];
    xyzTrajectory: string | null;
    totalConfigs: number;
  } | null>(null);

  const totalInputs = useMemo(
    () => Math.max(1, bondSteps) * Math.max(1, angleSteps) * Math.max(1, dihedralSteps) * Math.max(1, tempSteps),
    [bondSteps, angleSteps, dihedralSteps, tempSteps],
  );

  const handleFile = async (which: 1 | 2, file: File) => {
    const text = await file.text();
    const atoms = file.name.endsWith('.xyz') ? parseXyz(text) : parseGjf(text);
    if (atoms.length === 0) {
      setError(`Não foi possível ler ${file.name}. Use .gjf ou .xyz`);
      return;
    }
    if (which === 1) {
      setMol1(atoms);
      setMol1Name(file.name);
    } else {
      setMol2(atoms);
      setMol2Name(file.name);
    }
    setError(null);
  };

  const handleSubmit = async () => {
    if (mol1.length === 0 || mol2.length === 0) {
      setError('Carregue os dois arquivos de molécula antes de gerar.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/v1/md/generate-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mol1, mol2,
          dynamicsType,
          bondMin, bondMax, bondSteps,
          angleMin, angleMax, angleSteps,
          dihedralMin, dihedralMax, dihedralSteps,
          tempMin, tempMax, tempSteps,
          addChiral,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.detail || 'Erro');
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Layers className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Múltiplos Inputs</h1>
          <p className="text-sm text-muted-foreground">
            Gere um conjunto de inputs CPMD interpolando entre duas estruturas moleculares.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Arquivos de moléculas</CardTitle>
          <CardDescription>Aceita .gjf (Gaussian) ou .xyz</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileDropZone
              label="Molécula 1"
              filename={mol1Name}
              count={mol1.length}
              onFile={(f) => handleFile(1, f)}
              onClear={() => { setMol1([]); setMol1Name(''); }}
            />
            <FileDropZone
              label="Molécula 2"
              filename={mol2Name}
              count={mol2.length}
              onFile={(f) => handleFile(2, f)}
              onClear={() => { setMol2([]); setMol2Name(''); }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Faixas de parâmetros</CardTitle>
          <CardDescription>Mínimo, máximo e número de passos para cada variável.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-2 font-medium text-muted-foreground"></th>
                  <th className="py-2 px-2 font-medium">Bond Length</th>
                  <th className="py-2 px-2 font-medium">Bond Angle</th>
                  <th className="py-2 px-2 font-medium">Dihedral</th>
                  <th className="py-2 px-2 font-medium">Temperature (K)</th>
                </tr>
              </thead>
              <tbody>
                <ParamTableRow label="Mínimo" values={[bondMin, angleMin, dihedralMin, tempMin]} setters={[setBondMin, setAngleMin, setDihedralMin, setTempMin]} />
                <ParamTableRow label="Máximo" values={[bondMax, angleMax, dihedralMax, tempMax]} setters={[setBondMax, setAngleMax, setDihedralMax, setTempMax]} />
                <ParamTableRow label="Passos" values={[bondSteps, angleSteps, dihedralSteps, tempSteps]} setters={[setBondSteps, setAngleSteps, setDihedralSteps, setTempSteps]} integer />
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={addChiral}
                onChange={(e) => setAddChiral(e.target.checked)}
                className="accent-primary"
              />
              <span>Adicionar inversão chiral</span>
            </label>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Dinâmica:</label>
              <select
                className="rounded-md border bg-background px-3 py-1.5 text-sm"
                value={dynamicsType}
                onChange={(e) => setDynamicsType(e.target.value)}
              >
                <option value="CPMD">CPMD</option>
                <option value="BOMD">BOMD</option>
                <option value="PIMD">PIMD</option>
                <option value="SHMD">SHMD</option>
                <option value="MTD">MTD</option>
              </select>
            </div>

            <div className="flex-1 min-w-fit text-right">
              <div className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm">
                <span className="text-muted-foreground">Total de inputs:</span>
                <strong className="text-primary">
                  {totalInputs}
                  {addChiral ? ` × 2 = ${totalInputs * 2}` : ''}
                </strong>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={loading || mol1.length === 0 || mol2.length === 0}
          size="lg"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</>
          ) : (
            'Gerar Múltiplos Inputs'
          )}
        </Button>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Resultado</CardTitle>
            <CardDescription>
              {result.files.length} arquivos gerados em {result.totalConfigs} configurações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.xyzTrajectory && (
              <Button
                variant="outline"
                onClick={() => downloadFile('xyz_file.xyz', result.xyzTrajectory!)}
                className="w-full sm:w-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                Trajetória completa (xyz_file.xyz)
              </Button>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto rounded-md border p-2">
              {result.files.map((f) => (
                <button
                  key={f.filename}
                  className="flex items-center justify-between gap-2 text-left text-xs rounded-md border bg-background px-3 py-2 hover:bg-accent transition-colors"
                  onClick={() => downloadFile(f.filename, f.content)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="size-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="font-mono truncate">{f.filename}</span>
                  </div>
                  <Download className="size-3.5 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FileDropZone({
  label,
  filename,
  count,
  onFile,
  onClear,
}: {
  label: string;
  filename: string;
  count: number;
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div>
      <div className="text-sm font-medium mb-1.5">{label}</div>
      {filename ? (
        <div className="rounded-md border bg-muted/30 px-3 py-3 flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary flex-shrink-0">
            <FileText className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{filename}</p>
            <p className="text-xs text-muted-foreground">{count} átomos</p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="rounded-md p-1 hover:bg-background text-muted-foreground hover:text-foreground"
            aria-label="Remover arquivo"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) onFile(f);
          }}
          className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-8 cursor-pointer transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-input hover:border-primary hover:bg-accent/30'
          }`}
        >
          <input
            type="file"
            accept=".gjf,.xyz,.com"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            className="hidden"
          />
          <Upload className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">Selecione ou arraste um arquivo</p>
          <p className="text-xs text-muted-foreground">.gjf, .xyz</p>
        </label>
      )}
    </div>
  );
}

function ParamTableRow({
  label,
  values,
  setters,
  integer,
}: {
  label: string;
  values: number[];
  setters: ((v: number) => void)[];
  integer?: boolean;
}) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-2 pr-2 text-sm font-medium text-muted-foreground">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="py-2 px-1">
          <Input
            type="number"
            step={integer ? 1 : 0.1}
            value={v}
            onChange={(e) => {
              const n = integer ? parseInt(e.target.value) : parseFloat(e.target.value);
              if (!Number.isNaN(n)) setters[i](n);
            }}
          />
        </td>
      ))}
    </tr>
  );
}
