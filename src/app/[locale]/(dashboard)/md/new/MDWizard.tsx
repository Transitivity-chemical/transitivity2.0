'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, Download, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { SAMPLE_MD_GEOMETRY } from '@/lib/sample-data';
import { FilePicker, type BucketFile } from '@/components/files/FilePicker';

/**
 * FIX-6 of post-megaplan audit:
 *
 * Single-page form matching the Tkinter Transitivity v1 layout exactly.
 * Replaces the previous 4-step wizard.
 *
 * Reference: docs/audit-tkinter-md-multi.md §A
 *
 * Layout (top to bottom):
 *   1. File upload (.xyz/.gjf/.out/.log) → parses atoms
 *   2. Dynamics radio (5 methods)
 *   3. Options grid (functional/pseudo/charge+LSD/maxStep/temp+unit/timeStep)
 *   4. Lattices (a/b/c) and cos(a/b/c)
 *   5. Generate Input button
 *   6. Result panel with download buttons
 */

type Atom = { element: string; x: number; y: number; z: number };

const DYNAMICS = [
  { value: 'CPMD', label: 'Car Parrinello (CPMD)' },
  { value: 'PIMD', label: 'Path Integral (PIMD)' },
  { value: 'SHMD', label: 'Surface Hopping (TSH)' },
  { value: 'MTD', label: 'Meta Dynamics (MTD)' },
  { value: 'BOMD', label: 'Born Oppenheimer (BOMD)' },
];
const MAX_ATOMS = 1200;

function parseXyz(text: string): Atom[] {
  const lines = text.trim().split(/\r?\n/);
  const n = parseInt(lines[0]?.trim() ?? '', 10);
  if (Number.isNaN(n)) return [];
  const out: Atom[] = [];
  for (let i = 2; i < 2 + n && i < lines.length; i++) {
    const p = lines[i].trim().split(/\s+/);
    if (p.length < 4) continue;
    out.push({ element: p[0], x: parseFloat(p[1]), y: parseFloat(p[2]), z: parseFloat(p[3]) });
  }
  return out;
}

function parseGjf(text: string): Atom[] {
  const lines = text.split(/\r?\n/);
  const out: Atom[] = [];
  let started = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!started) {
      if (/^-?\d+\s+\d+$/.test(line)) started = true;
      continue;
    }
    if (!line) break;
    const p = line.split(/\s+/);
    if (p.length < 4) break;
    if (Number.isNaN(parseFloat(p[1]))) break;
    out.push({ element: p[0], x: parseFloat(p[1]), y: parseFloat(p[2]), z: parseFloat(p[3]) });
  }
  return out;
}

function parseGaussianLog(text: string): Atom[] {
  // Find the LAST "Standard orientation:" block
  const idx = text.lastIndexOf('Standard orientation:');
  if (idx === -1) return [];
  const block = text.slice(idx);
  const lines = block.split(/\r?\n/);
  const out: Atom[] = [];
  // Skip 5 header lines, then read until ----
  let i = 5;
  while (i < lines.length && !lines[i].includes('---')) i++;
  i++;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('---')) break;
    const p = line.trim().split(/\s+/);
    if (p.length < 6) break;
    const z = parseInt(p[1], 10);
    const x = parseFloat(p[3]);
    const y = parseFloat(p[4]);
    const zCoord = parseFloat(p[5]);
    if (Number.isNaN(z)) break;
    out.push({ element: ELEMENT_BY_Z[z] ?? `Z${z}`, x, y, z: zCoord });
  }
  return out;
}

const ELEMENT_BY_Z: Record<number, string> = {
  1: 'H', 2: 'He', 3: 'Li', 4: 'Be', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 10: 'Ne',
  11: 'Na', 12: 'Mg', 13: 'Al', 14: 'Si', 15: 'P', 16: 'S', 17: 'Cl', 18: 'Ar',
  19: 'K', 20: 'Ca', 26: 'Fe', 29: 'Cu', 30: 'Zn', 35: 'Br', 53: 'I', 78: 'Pt', 79: 'Au',
};

export function MDWizard() {
  const t = useTranslations('md');
  const router = useRouter();

  // Atom data
  const [atoms, setAtoms] = useState<Atom[]>([]);
  const [filename, setFilename] = useState('');

  // Form fields (Tkinter defaults)
  const [name, setName] = useState('');
  const [dynamicsType, setDynamicsType] = useState('CPMD');
  const [functional, setFunctional] = useState('PBE');
  const [pseudo, setPseudo] = useState('MT');
  const [maxSteps, setMaxSteps] = useState(50000);
  const [tempK, setTempK] = useState(300);
  const [tempUnit, setTempUnit] = useState<'K' | 'C'>('K');
  const [charge, setCharge] = useState(0);
  const [lsd, setLsd] = useState(true);
  const [timeStep, setTimeStep] = useState(5.0);

  const [latticeA, setLatticeA] = useState(10);
  const [latticeB, setLatticeB] = useState(10);
  const [latticeC, setLatticeC] = useState(10);
  const [cosA, setCosA] = useState(0);
  const [cosB, setCosB] = useState(0);
  const [cosC, setCosC] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Route returns the persisted MDSimulation with `generatedFiles` array
  const [result, setResult] = useState<{
    id: string;
    name: string | null;
    generatedFiles: Array<{ id: string; filename: string; content: string; fileType: string }>;
  } | null>(null);

  const parseText = (text: string, fname: string) => {
    const ext = fname.toLowerCase().split('.').pop() ?? '';
    let parsed: Atom[] = [];
    if (ext === 'xyz') parsed = parseXyz(text);
    else if (ext === 'gjf' || ext === 'com') parsed = parseGjf(text);
    else if (ext === 'log' || ext === 'out') parsed = parseGaussianLog(text);
    else parsed = parseXyz(text);

    if (parsed.length === 0) {
      setError(`Não foi possível extrair átomos de ${fname}`);
      return;
    }
    if (parsed.length > MAX_ATOMS) {
      setError(`Limite de ${MAX_ATOMS} átomos excedido (${parsed.length}).`);
      return;
    }
    setAtoms(parsed);
    setFilename(fname);
    if (!name) setName(fname.replace(/\.[^.]+$/, ''));
    setError(null);
  };

  const handleBucketFile = async (file: BucketFile) => {
    try {
      const res = await fetch(`/api/v1/files/${file.id}/download`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      parseText(text, file.originalName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao baixar do bucket');
    }
  };

  const loadExample = () => {
    // SAMPLE_MD_GEOMETRY is an array of {element, x, y, z} (strings)
    const parsed: Atom[] = (SAMPLE_MD_GEOMETRY as Array<{ element: string; x: string; y: string; z: string }>).map((a) => ({
      element: a.element,
      x: parseFloat(a.x),
      y: parseFloat(a.y),
      z: parseFloat(a.z),
    }));
    setAtoms(parsed);
    setFilename('benzoic_acid_example.xyz');
    if (!name) setName('benzoic_acid_example');
  };

  const handleGenerate = async () => {
    if (atoms.length === 0) {
      setError('Carregue um arquivo de geometria primeiro.');
      toast.error('Carregue um arquivo de geometria primeiro');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    const toastId = toast.loading('Gerando arquivos de input...');
    try {
      const res = await fetch('/api/v1/md/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          atoms,
          dynamicsType,
          functional,
          pseudopotential: pseudo,
          charge,
          lsd: lsd ? 1 : 0,
          temperature: tempK, // always K
          maxSteps,
          timeStep,
          latticeA,
          latticeB,
          latticeC,
          cosA,
          cosB,
          cosC,
          generateWavefunction: true,
          generateGaussview: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || 'Erro');
      setResult(data);

      const fileCount = data.generatedFiles?.length ?? 0;
      toast.success(`${fileCount} arquivo${fileCount !== 1 ? 's' : ''} gerado${fileCount !== 1 ? 's' : ''}`, {
        id: toastId,
        description: 'Baixando automaticamente e abrindo o resultado',
      });

      // Auto-download every generated file
      if (data.generatedFiles && Array.isArray(data.generatedFiles)) {
        for (const f of data.generatedFiles) {
          downloadFile(f.filename, f.content);
        }
      }

      // Navigate to the result page
      if (data.id) {
        const locale = window.location.pathname.split('/')[1] || 'pt-BR';
        setTimeout(() => router.push(`/${locale}/md/${data.id}`), 600);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao gerar input';
      setError(msg);
      toast.error('Falha ao gerar input', { id: toastId, description: msg });
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (fname: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fname;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dinâmica Molecular</h1>
          <p className="text-sm text-muted-foreground">Gere arquivos de input CPMD, BOMD, PIMD, SHMD ou MTD.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadExample}>
          <FlaskConical className="h-4 w-4 mr-2" />
          Carregar exemplo
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_minmax(0,1fr)]">
        {/* 1. File upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Arquivo de geometria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex flex-1 items-center gap-2 rounded-md border-2 border-dashed border-input px-4 py-3 text-sm font-medium transition-colors hover:border-primary hover:bg-accent"
              >
                <Upload className="size-4" />
                {filename || 'Escolher arquivo · Pick from gallery (.xyz, .gjf, .out, .log)'}
              </button>
              {atoms.length > 0 && (
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {atoms.length} átomos
                </span>
              )}
            </div>
            <div className="mt-3">
              <Label htmlFor="md-name" className="text-xs">
                Nome da simulação
              </Label>
              <Input
                id="md-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: H2O_CPMD"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. Dynamics radio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tipo de dinâmica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DYNAMICS.map((d) => (
                <label
                  key={d.value}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 transition-colors ${
                    dynamicsType === d.value
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-input hover:bg-accent'
                  }`}
                >
                  <input
                    type="radio"
                    name="dynamics"
                    value={d.value}
                    checked={dynamicsType === d.value}
                    onChange={(e) => setDynamicsType(e.target.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm">{d.label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 3. Options grid (3 cols × 2 rows = Tkinter layout) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Opções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <Label htmlFor="functional">Functional</Label>
                <Input
                  id="functional"
                  value={functional}
                  onChange={(e) => setFunctional(e.target.value)}
                  className="mt-1"
                />
            </div>
            <div>
              <Label htmlFor="pseudo">Pseudo</Label>
              <Input id="pseudo" value={pseudo} onChange={(e) => setPseudo(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="maxsteps">Max Step</Label>
              <Input
                id="maxsteps"
                type="number"
                value={maxSteps}
                onChange={(e) => setMaxSteps(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="temp">Temperatura</Label>
                <div className="inline-flex rounded-md border bg-muted/30 text-xs overflow-hidden">
                  <button
                    type="button"
                    className={`px-2 py-0.5 ${tempUnit === 'K' ? 'bg-primary text-primary-foreground' : ''}`}
                    onClick={() => setTempUnit('K')}
                  >
                    K
                  </button>
                  <button
                    type="button"
                    className={`px-2 py-0.5 ${tempUnit === 'C' ? 'bg-primary text-primary-foreground' : ''}`}
                    onClick={() => setTempUnit('C')}
                  >
                    °C
                  </button>
                </div>
              </div>
              <Input
                id="temp"
                type="number"
                step="0.1"
                value={tempUnit === 'K' ? tempK : Number((tempK - 273.15).toFixed(2))}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (Number.isNaN(v)) return;
                  setTempK(tempUnit === 'K' ? v : v + 273.15);
                }}
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">Enviado: {tempK.toFixed(2)} K</p>
            </div>
            <div>
              <Label>Carga &amp; LSD</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  type="number"
                  value={charge}
                  onChange={(e) => setCharge(parseInt(e.target.value) || 0)}
                  className="flex-1"
                />
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={lsd}
                    onChange={(e) => setLsd(e.target.checked)}
                    className="accent-primary"
                  />
                  LSD
                </label>
              </div>
            </div>
            <div>
              <Label htmlFor="timestep">Time Step</Label>
              <Input
                id="timestep"
                type="number"
                step="0.1"
                value={timeStep}
                onChange={(e) => setTimeStep(parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
        </Card>

        {/* 4. Lattices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lattices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {[
                { label: 'a', value: latticeA, set: setLatticeA },
                { label: 'b', value: latticeB, set: setLatticeB },
                { label: 'c', value: latticeC, set: setLatticeC },
              ].map((f) => (
                <div key={f.label}>
                  <Label>{f.label}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={f.value}
                    onChange={(e) => f.set(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              ))}
              {[
                { label: 'cos(a)', value: cosA, set: setCosA },
                { label: 'cos(b)', value: cosB, set: setCosB },
                { label: 'cos(c)', value: cosC, set: setCosC },
              ].map((f) => (
                <div key={f.label}>
                  <Label>{f.label}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={f.value}
                    onChange={(e) => f.set(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="status" aria-live="assertive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-border/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">
          {filename ? (
            <>
              Arquivo: <span className="font-mono">{filename}</span> — {atoms.length} átomos
            </>
          ) : (
            'Nenhum arquivo carregado'
          )}
        </div>
        <Button onClick={handleGenerate} disabled={loading || atoms.length === 0} size="sm">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...
            </>
          ) : (
            'Gerar input'
          )}
        </Button>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Arquivos gerados ({result.generatedFiles?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!result.generatedFiles || result.generatedFiles.length === 0) ? (
              <p className="text-sm text-muted-foreground">Nenhum arquivo retornado.</p>
            ) : (
              <div className="space-y-2">
                {result.generatedFiles.map((file) => (
                  <button
                    key={file.id}
                    className="w-full text-left flex items-center justify-between rounded-md border px-3 py-2 hover:bg-accent text-sm"
                    onClick={() => downloadFile(file.filename, file.content)}
                  >
                    <span className="font-mono">{file.filename}</span>
                    <span className="text-xs text-muted-foreground">{file.fileType}</span>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <FilePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleBucketFile}
        accept={['.xyz', '.gjf', '.com', '.out', '.log']}
        title="Escolher geometria"
        description="Escolha um arquivo já enviado ou clique em Enviar para adicionar um novo."
      />
    </div>
  );
}

export default MDWizard;
