'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Download } from 'lucide-react';

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
      <div>
        <h1 className="text-2xl font-semibold">Múltiplos Inputs</h1>
        <p className="text-sm text-muted-foreground">
          Gere um conjunto de inputs CPMD interpolando entre duas estruturas moleculares.
          Reference: Tkinter v1 Multiple Inputs tab.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Arquivos de molécula</CardTitle>
          <CardDescription>Aceita .gjf (Gaussian) ou .xyz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Molécula 1</label>
              <Input
                type="file"
                accept=".gjf,.xyz"
                onChange={(e) => e.target.files?.[0] && handleFile(1, e.target.files[0])}
              />
              {mol1Name && (
                <p className="text-xs text-muted-foreground mt-1">
                  {mol1Name} — {mol1.length} átomos
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Molécula 2</label>
              <Input
                type="file"
                accept=".gjf,.xyz"
                onChange={(e) => e.target.files?.[0] && handleFile(2, e.target.files[0])}
              />
              {mol2Name && (
                <p className="text-xs text-muted-foreground mt-1">
                  {mol2Name} — {mol2.length} átomos
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parâmetros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3 text-xs font-medium text-muted-foreground mb-2">
            <span></span>
            <span>Bond Length</span>
            <span>Bond Angle</span>
            <span>Dihedral / Temp</span>
          </div>
          <ParamRow label="Mínimo" values={[bondMin, angleMin, dihedralMin, tempMin]} setters={[setBondMin, setAngleMin, setDihedralMin, setTempMin]} />
          <ParamRow label="Máximo" values={[bondMax, angleMax, dihedralMax, tempMax]} setters={[setBondMax, setAngleMax, setDihedralMax, setTempMax]} />
          <ParamRow label="Passos" values={[bondSteps, angleSteps, dihedralSteps, tempSteps]} setters={[setBondSteps, setAngleSteps, setDihedralSteps, setTempSteps]} integer />

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <input
                id="chiral"
                type="checkbox"
                checked={addChiral}
                onChange={(e) => setAddChiral(e.target.checked)}
              />
              <label htmlFor="chiral" className="text-sm">Add Chiral</label>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Dinâmica</label>
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
            <div className="flex-1 text-right">
              <span className="text-sm">
                Total de inputs: <strong>{totalInputs}</strong>
                {addChiral && <span className="text-muted-foreground"> (×2 com chiral)</span>}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={loading || mol1.length === 0 || mol2.length === 0}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : 'Gerar Múltiplos Inputs'}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado: {result.files.length} arquivos gerados</CardTitle>
            <CardDescription>{result.totalConfigs} configurações calculadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.xyzTrajectory && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile('xyz_file.xyz', result.xyzTrajectory!)}
              >
                <Download className="mr-2 h-4 w-4" />
                xyz_file.xyz (trajetória completa)
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {result.files.map((f) => (
                <button
                  key={f.filename}
                  className="text-left text-xs rounded-md border px-3 py-2 hover:bg-accent"
                  onClick={() => downloadFile(f.filename, f.content)}
                >
                  <span className="font-mono">{f.filename}</span>
                  <span className="ml-2 text-muted-foreground">[{f.type}]</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ParamRow({
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
    <div className="grid grid-cols-4 gap-3 mb-2 items-center">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {values.map((v, i) => (
        <Input
          key={i}
          type="number"
          step={integer ? 1 : 0.1}
          value={v}
          onChange={(e) => {
            const n = integer ? parseInt(e.target.value) : parseFloat(e.target.value);
            if (!Number.isNaN(n)) setters[i](n);
          }}
        />
      ))}
    </div>
  );
}
