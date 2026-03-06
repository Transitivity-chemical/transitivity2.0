'use client';

import { useState, useCallback, useRef, type DragEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Upload,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Loader2,
  CheckCircle,
  Atom,
  Zap,
  Settings,
  ClipboardList,
} from 'lucide-react';
import { SAMPLE_ML_GEOMETRY } from '@/lib/sample-data';
import { fetchApi } from '@/lib/client-api/base';

// ─── Types ───────────────────────────────────────────────────────────
interface AtomRow {
  element: string;
  x: string;
  y: string;
  z: string;
}

type Model = 'ANI-2x' | 'MACE' | 'AIQM1';
type Task = 'energy' | 'optimize';

interface PredictResult {
  job: {
    id: string;
    name: string;
    status: string;
  };
  result: {
    energy_hartree?: number;
    energy_kjmol?: number;
    forces?: number[][];
    optimized_atoms?: { element: string; x: number; y: number; z: number }[];
    [key: string]: unknown;
  };
}

const MODELS: { value: Model; label: string; descKey: string }[] = [
  { value: 'ANI-2x', label: 'ANI-2x', descKey: 'modelANI2xDesc' },
  { value: 'MACE', label: 'MACE', descKey: 'modelMACEDesc' },
  { value: 'AIQM1', label: 'AIQM1', descKey: 'modelAIQM1Desc' },
];

const TASKS: { value: Task; descKey: string; labelKey: string }[] = [
  { value: 'energy', labelKey: 'taskEnergy', descKey: 'taskEnergyDesc' },
  { value: 'optimize', labelKey: 'taskOptimize', descKey: 'taskOptimizeDesc' },
];

const STEP_ICONS = [Atom, Zap, Settings, ClipboardList];

function emptyAtom(): AtomRow {
  return { element: '', x: '', y: '', z: '' };
}

function parseXYZ(text: string): AtomRow[] {
  const lines = text.trim().split('\n');
  const atoms: AtomRow[] = [];
  // XYZ format: first line = atom count, second line = comment, rest = atoms
  const startIdx = lines.length > 2 && /^\s*\d+\s*$/.test(lines[0].trim()) ? 2 : 0;
  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].trim().split(/\s+/);
    if (parts.length >= 4) {
      atoms.push({
        element: parts[0],
        x: parts[1],
        y: parts[2],
        z: parts[3],
      });
    }
  }
  return atoms;
}

// ─── Component ───────────────────────────────────────────────────────
export function MLWizard() {
  const t = useTranslations('ml');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [atoms, setAtoms] = useState<AtomRow[]>([emptyAtom()]);
  const [model, setModel] = useState<Model>('ANI-2x');
  const [task, setTask] = useState<Task>('energy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PredictResult | null>(null);

  // XYZ file drop
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseXYZ(text);
      if (parsed.length > 0) {
        setAtoms(parsed);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const updateAtom = (idx: number, field: keyof AtomRow, value: string) => {
    setAtoms((prev) => prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));
  };

  const addAtom = () => setAtoms((prev) => [...prev, emptyAtom()]);

  const removeAtom = (idx: number) => {
    setAtoms((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const validAtoms = atoms.filter(
    (a) =>
      a.element.trim() !== '' &&
      !isNaN(parseFloat(a.x)) &&
      !isNaN(parseFloat(a.y)) &&
      !isNaN(parseFloat(a.z)),
  );

  const canProceedFromStep = (s: number) => {
    if (s === 0) return validAtoms.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = {
        atoms: validAtoms.map((a) => ({
          element: a.element.trim(),
          x: parseFloat(a.x),
          y: parseFloat(a.y),
          z: parseFloat(a.z),
        })),
        model,
        task,
      };
      const res = await fetchApi<PredictResult>('/api/v1/ml/predict', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'));
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    t('stepMolecule'),
    t('stepModel'),
    t('stepTask'),
    t('stepReview'),
  ];

  // ─── Step indicator ─────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((label, i) => {
        const Icon = STEP_ICONS[i];
        const isCurrent = i === step;
        const isDone = i < step;
        return (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-px w-8 ${isDone ? 'bg-primary' : 'bg-border'}`}
              />
            )}
            <button
              type="button"
              onClick={() => {
                if (isDone || (i <= step && canProceedFromStep(i - 1))) {
                  setStep(i);
                }
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isCurrent
                  ? 'bg-primary text-primary-foreground'
                  : isDone
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              <Icon className="size-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );

  // ─── Step 1: Molecule Input ─────────────────────────────────────────
  const StepMolecule = () => (
    <Card>
      <CardHeader>
        <CardTitle>{t('stepMolecule')}</CardTitle>
        <CardDescription>{t('moleculeInputDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File drop zone */}
        <div
          className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xyz"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          />
          <Upload className="mx-auto size-8 text-muted-foreground mb-2" />
          <p className="text-sm">{t('dropXyz')}</p>
          <Button
            variant="link"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            {t('browseXyz')}
          </Button>
        </div>

        {/* Atom table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-2 w-10">#</th>
                <th className="py-2 pr-2">{t('element')}</th>
                <th className="py-2 pr-2">X</th>
                <th className="py-2 pr-2">Y</th>
                <th className="py-2 pr-2">Z</th>
                <th className="py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {atoms.map((atom, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="py-1.5 pr-2 text-muted-foreground">{idx + 1}</td>
                  <td className="py-1.5 pr-2">
                    <input
                      className="w-16 rounded border bg-background px-2 py-1 text-sm"
                      value={atom.element}
                      placeholder="H"
                      onChange={(e) => updateAtom(idx, 'element', e.target.value)}
                    />
                  </td>
                  {(['x', 'y', 'z'] as const).map((coord) => (
                    <td key={coord} className="py-1.5 pr-2">
                      <input
                        className="w-24 rounded border bg-background px-2 py-1 text-sm font-mono"
                        value={atom[coord]}
                        placeholder="0.0"
                        onChange={(e) => updateAtom(idx, coord, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeAtom(idx)}
                      disabled={atoms.length <= 1}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button variant="outline" size="sm" onClick={addAtom}>
          <Plus className="mr-1 size-3.5" />
          {t('addAtom')}
        </Button>

        <p className="text-xs text-muted-foreground">
          {t('validAtoms', { count: validAtoms.length })}
        </p>
      </CardContent>
    </Card>
  );

  // ─── Step 2: Model Selection ────────────────────────────────────────
  const StepModel = () => (
    <Card>
      <CardHeader>
        <CardTitle>{t('stepModel')}</CardTitle>
        <CardDescription>{t('modelSelectDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {MODELS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setModel(m.value)}
              className={`rounded-lg border p-4 text-left transition-all ${
                model === m.value
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className="size-4 text-primary" />
                <span className="font-semibold text-sm">{m.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t(m.descKey)}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // ─── Step 3: Task Selection ─────────────────────────────────────────
  const StepTask = () => (
    <Card>
      <CardHeader>
        <CardTitle>{t('stepTask')}</CardTitle>
        <CardDescription>{t('taskSelectDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {TASKS.map((tk) => (
            <button
              key={tk.value}
              type="button"
              onClick={() => setTask(tk.value)}
              className={`rounded-lg border p-4 text-left transition-all ${
                task === tk.value
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <span className="font-semibold text-sm">{t(tk.labelKey)}</span>
              <p className="text-xs text-muted-foreground mt-1">{t(tk.descKey)}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // ─── Step 4: Review & Run ───────────────────────────────────────────
  const StepReview = () => (
    <Card>
      <CardHeader>
        <CardTitle>{t('stepReview')}</CardTitle>
        <CardDescription>{t('reviewDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-1">{t('stepMolecule')}</p>
            <p className="font-medium text-sm">
              {validAtoms.length} {t('atoms')}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-1">{t('stepModel')}</p>
            <p className="font-medium text-sm">{model}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-1">{t('stepTask')}</p>
            <p className="font-medium text-sm">
              {task === 'energy' ? t('taskEnergy') : t('taskOptimize')}
            </p>
          </div>
        </div>

        {/* Atom preview */}
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            {t('showAtoms')}
          </summary>
          <div className="mt-2 overflow-x-auto rounded border">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-2 py-1 text-left">{t('element')}</th>
                  <th className="px-2 py-1 text-right">X</th>
                  <th className="px-2 py-1 text-right">Y</th>
                  <th className="px-2 py-1 text-right">Z</th>
                </tr>
              </thead>
              <tbody>
                {validAtoms.map((a, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-2 py-1">{a.element}</td>
                    <td className="px-2 py-1 text-right">{a.x}</td>
                    <td className="px-2 py-1 text-right">{a.y}</td>
                    <td className="px-2 py-1 text-right">{a.z}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm font-medium">{t('computing')}</p>
          </div>
        )}

        {result && <ResultDisplay result={result} />}

        {!loading && !result && (
          <Button onClick={handleSubmit} className="w-full">
            {t('runPrediction')}
          </Button>
        )}

        {result && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/${locale}/ml/${result.job.id}`)}>
              {t('viewJob')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setStep(0);
              }}
            >
              {t('newPrediction')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // ─── Result Display ─────────────────────────────────────────────────
  const ResultDisplay = ({ result: res }: { result: PredictResult }) => (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center gap-2">
        <CheckCircle className="size-5 text-green-500" />
        <span className="font-semibold text-sm">{t('resultReady')}</span>
        <Badge variant="default">{res.job.status}</Badge>
      </div>

      {/* Energy */}
      {res.result.energy_hartree != null && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded border p-3">
            <p className="text-xs text-muted-foreground">{t('energyHartree')}</p>
            <p className="font-mono text-lg font-semibold">
              {res.result.energy_hartree.toFixed(8)}
            </p>
          </div>
          {res.result.energy_kjmol != null && (
            <div className="rounded border p-3">
              <p className="text-xs text-muted-foreground">{t('energyKjmol')}</p>
              <p className="font-mono text-lg font-semibold">
                {res.result.energy_kjmol.toFixed(4)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Forces */}
      {res.result.forces && res.result.forces.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            {t('forces')} ({res.result.forces.length} {t('atoms')})
          </summary>
          <div className="mt-2 overflow-x-auto rounded border">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-2 py-1 text-left">#</th>
                  <th className="px-2 py-1 text-right">Fx</th>
                  <th className="px-2 py-1 text-right">Fy</th>
                  <th className="px-2 py-1 text-right">Fz</th>
                </tr>
              </thead>
              <tbody>
                {res.result.forces.map((f, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-2 py-1">{i + 1}</td>
                    <td className="px-2 py-1 text-right">{f[0]?.toFixed(6)}</td>
                    <td className="px-2 py-1 text-right">{f[1]?.toFixed(6)}</td>
                    <td className="px-2 py-1 text-right">{f[2]?.toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {/* Optimized geometry */}
      {res.result.optimized_atoms && res.result.optimized_atoms.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            {t('optimizedGeometry')} ({res.result.optimized_atoms.length} {t('atoms')})
          </summary>
          <div className="mt-2 overflow-x-auto rounded border">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-2 py-1 text-left">{t('element')}</th>
                  <th className="px-2 py-1 text-right">X</th>
                  <th className="px-2 py-1 text-right">Y</th>
                  <th className="px-2 py-1 text-right">Z</th>
                </tr>
              </thead>
              <tbody>
                {res.result.optimized_atoms.map((a, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-2 py-1">{a.element}</td>
                    <td className="px-2 py-1 text-right">{a.x.toFixed(6)}</td>
                    <td className="px-2 py-1 text-right">{a.y.toFixed(6)}</td>
                    <td className="px-2 py-1 text-right">{a.z.toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );

  // ─── Navigation ─────────────────────────────────────────────────────
  const totalSteps = 4;

  return (
    <div className="max-w-3xl space-y-4">
      {/* Load Example */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAtoms(
              SAMPLE_ML_GEOMETRY.map((a) => ({
                element: a.element,
                x: a.x,
                y: a.y,
                z: a.z,
              })),
            );
          }}
        >
          <FlaskConical className="mr-1.5 size-4" />
          Load Example
        </Button>
        <span className="text-xs text-muted-foreground">
          Benzoic acid (C7H6O2) — 15 atoms
        </span>
      </div>

      <StepIndicator />

      {step === 0 && <StepMolecule />}
      {step === 1 && <StepModel />}
      {step === 2 && <StepTask />}
      {step === 3 && <StepReview />}

      {/* Nav buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ChevronLeft className="mr-1 size-4" />
          {tCommon('back')}
        </Button>
        {step < totalSteps - 1 && (
          <Button
            onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}
            disabled={!canProceedFromStep(step)}
          >
            {tCommon('next')}
            <ChevronRight className="ml-1 size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
