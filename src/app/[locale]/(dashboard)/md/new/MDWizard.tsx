'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Plus,
  Trash2,
  Upload,
  Loader2,
} from 'lucide-react';
import { SAMPLE_MD_GEOMETRY } from '@/lib/sample-data';

/* ---------- types ---------- */

interface AtomRow {
  id: string;
  element: string;
  x: string;
  y: string;
  z: string;
}

interface SimConfig {
  name: string;
  dynamicsType: string;
  functional: string;
  charge: number;
  lsd: number;
  temperature: number;
  maxSteps: number;
  timeStep: number;
  latticeA: number;
  latticeB: number;
  latticeC: number;
  cosA: number;
  cosB: number;
  cosC: number;
  cutoff: number;
  emass: number;
  multiplicity: number;
  generateWavefunction: boolean;
  generateGaussview: boolean;
}

const DYNAMICS_TYPES = ['CPMD', 'BOMD', 'PIMD', 'SHMD', 'MTD'] as const;
const FUNCTIONALS = ['BLYP', 'PBE', 'BP86', 'PW91', 'B3LYP', 'PBE0'] as const;

let rowCounter = 0;
function newAtomRow(): AtomRow {
  return { id: `a${++rowCounter}`, element: '', x: '', y: '', z: '' };
}

function parseXYZ(text: string): AtomRow[] | null {
  const lines = text.trim().split('\n');
  if (lines.length < 3) return null;
  const nAtoms = parseInt(lines[0].trim(), 10);
  if (isNaN(nAtoms) || lines.length < nAtoms + 2) return null;
  const atoms: AtomRow[] = [];
  for (let i = 2; i < 2 + nAtoms; i++) {
    const parts = lines[i].trim().split(/\s+/);
    if (parts.length < 4) return null;
    atoms.push({
      id: `a${++rowCounter}`,
      element: parts[0],
      x: parts[1],
      y: parts[2],
      z: parts[3],
    });
  }
  return atoms;
}

const TOTAL_STEPS = 5;

/* ---------- component ---------- */

export function MDWizard() {
  const t = useTranslations('md');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [atoms, setAtoms] = useState<AtomRow[]>([newAtomRow(), newAtomRow()]);
  const [config, setConfig] = useState<SimConfig>({
    name: '',
    dynamicsType: 'CPMD',
    functional: 'BLYP',
    charge: 0,
    lsd: 0,
    temperature: 300,
    maxSteps: 10000,
    timeStep: 5.0,
    latticeA: 20.0,
    latticeB: 20.0,
    latticeC: 20.0,
    cosA: 0.0,
    cosB: 0.0,
    cosC: 0.0,
    cutoff: 70.0,
    emass: 400.0,
    multiplicity: 1,
    generateWavefunction: true,
    generateGaussview: true,
  });
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'loading' | 'error'
  >('idle');
  const [errorMsg, setErrorMsg] = useState('');

  /* helpers */
  const updateAtom = (id: string, field: keyof AtomRow, value: string) => {
    setAtoms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    );
  };

  const updateConfig = <K extends keyof SimConfig>(
    key: K,
    value: SimConfig[K],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const validAtoms = atoms.filter(
    (a) =>
      a.element.trim() !== '' &&
      !isNaN(parseFloat(a.x)) &&
      !isNaN(parseFloat(a.y)) &&
      !isNaN(parseFloat(a.z)),
  );

  const canProceed = (): boolean => {
    if (step === 0) return validAtoms.length >= 1;
    return true;
  };

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const parsed = parseXYZ(text);
        if (parsed && parsed.length > 0) {
          setAtoms(parsed);
        } else {
          setErrorMsg(t('invalidFile'));
          setTimeout(() => setErrorMsg(''), 3000);
        }
      };
      reader.readAsText(file);
    },
    [t],
  );

  const handleSubmit = async () => {
    setSubmitStatus('loading');
    setErrorMsg('');

    const payload = {
      name: config.name || undefined,
      atoms: validAtoms.map((a) => ({
        element: a.element.trim(),
        x: parseFloat(a.x),
        y: parseFloat(a.y),
        z: parseFloat(a.z),
      })),
      dynamicsType: config.dynamicsType,
      functional: config.functional,
      charge: config.charge,
      lsd: config.lsd,
      temperature: config.temperature,
      maxSteps: config.maxSteps,
      timeStep: config.timeStep,
      latticeA: config.latticeA,
      latticeB: config.latticeB,
      latticeC: config.latticeC,
      cosA: config.cosA,
      cosB: config.cosB,
      cosC: config.cosC,
      cutoff: config.cutoff,
      emass: config.emass,
      multiplicity: config.multiplicity,
      generateWavefunction: config.generateWavefunction,
      generateGaussview: config.generateGaussview,
    };

    try {
      const res = await fetch('/api/v1/md/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setSubmitStatus('error');
        setErrorMsg(json.error || 'Generation failed');
        return;
      }

      // Navigate to the result page
      router.push(`md/${json.id}`);
    } catch {
      setSubmitStatus('error');
      setErrorMsg(tCommon('error'));
    }
  };

  /* step labels */
  const stepLabels = [
    t('stepMolecule'),
    t('stepSimulation'),
    t('stepCell'),
    t('stepOptions'),
    t('stepReview'),
  ];

  /* --------- input helper --------- */
  const inputCls =
    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30';
  const labelCls = 'mb-1 block text-sm font-medium';
  const selectCls =
    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <div className="space-y-6">
      {/* Load Example */}
      <div className="flex items-center gap-3 mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAtoms(
              SAMPLE_MD_GEOMETRY.map((a) => ({
                id: `a${++rowCounter}`,
                element: a.element,
                x: a.x,
                y: a.y,
                z: a.z,
              })),
            );
            updateConfig('name', 'Benzoic acid CPMD');
          }}
        >
          <FlaskConical className="mr-1.5 size-4" />
          Load Example
        </Button>
        <span className="text-xs text-muted-foreground">
          Benzoic acid (C7H6O2) — 15 atoms
        </span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {stepLabels.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                i === step
                  ? 'bg-primary text-primary-foreground'
                  : i < step
                    ? 'bg-primary/20 text-primary cursor-pointer'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1}
            </button>
            <span
              className={`hidden text-xs sm:inline ${
                i === step ? 'font-medium' : 'text-muted-foreground'
              }`}
            >
              {label}
            </span>
            {i < TOTAL_STEPS - 1 && (
              <div className="mx-1 h-px w-4 bg-border sm:w-8" />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Molecule */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('stepMolecule')}</CardTitle>
            <CardDescription>{t('moleculeDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div>
              <label className={labelCls}>{t('simulationName')}</label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => updateConfig('name', e.target.value)}
                placeholder={t('simulationNamePlaceholder')}
                className={inputCls}
              />
            </div>

            {/* Upload XYZ */}
            <div className="flex items-center gap-3">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".xyz,.gjf,.com"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
                  <Upload className="size-4" />
                  {t('uploadXYZ')}
                </span>
              </label>
              <span className="text-xs text-muted-foreground">
                {t('uploadXYZHint')}
              </span>
            </div>

            {/* Atom table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-2 py-2 font-medium">#</th>
                    <th className="px-2 py-2 font-medium">{t('element')}</th>
                    <th className="px-2 py-2 font-medium">X</th>
                    <th className="px-2 py-2 font-medium">Y</th>
                    <th className="px-2 py-2 font-medium">Z</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {atoms.map((atom, idx) => (
                    <tr key={atom.id} className="border-b">
                      <td className="px-2 py-1 text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={atom.element}
                          onChange={(e) =>
                            updateAtom(atom.id, 'element', e.target.value)
                          }
                          placeholder="C"
                          className="w-16 rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </td>
                      {(['x', 'y', 'z'] as const).map((coord) => (
                        <td key={coord} className="px-2 py-1">
                          <input
                            type="text"
                            value={atom[coord]}
                            onChange={(e) =>
                              updateAtom(atom.id, coord, e.target.value)
                            }
                            placeholder="0.000"
                            className="w-24 rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary/30"
                          />
                        </td>
                      ))}
                      <td className="px-2 py-1">
                        {atoms.length > 1 && (
                          <button
                            onClick={() =>
                              setAtoms((prev) =>
                                prev.filter((a) => a.id !== atom.id),
                              )
                            }
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAtoms((prev) => [...prev, newAtomRow()])}
            >
              <Plus className="mr-1 size-4" />
              {t('addAtom')}
            </Button>

            <p className="text-xs text-muted-foreground">
              {t('validAtoms', { count: validAtoms.length })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Simulation config */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('stepSimulation')}</CardTitle>
            <CardDescription>{t('simulationDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className={labelCls}>{t('dynamicsType')}</label>
                <select
                  value={config.dynamicsType}
                  onChange={(e) => updateConfig('dynamicsType', e.target.value)}
                  className={selectCls}
                >
                  {DYNAMICS_TYPES.map((dt) => (
                    <option key={dt} value={dt}>
                      {dt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>{t('functional')}</label>
                <select
                  value={config.functional}
                  onChange={(e) => updateConfig('functional', e.target.value)}
                  className={selectCls}
                >
                  {FUNCTIONALS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>{t('charge')}</label>
                <input
                  type="number"
                  value={config.charge}
                  onChange={(e) => updateConfig('charge', parseInt(e.target.value) || 0)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>{t('lsd')}</label>
                <select
                  value={config.lsd}
                  onChange={(e) => updateConfig('lsd', parseInt(e.target.value))}
                  className={selectCls}
                >
                  <option value={0}>{t('lsdOff')}</option>
                  <option value={1}>{t('lsdOn')}</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>{t('temperature')} (K)</label>
                <input
                  type="number"
                  value={config.temperature}
                  onChange={(e) =>
                    updateConfig('temperature', parseFloat(e.target.value) || 300)
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>{t('maxSteps')}</label>
                <input
                  type="number"
                  value={config.maxSteps}
                  onChange={(e) =>
                    updateConfig('maxSteps', parseInt(e.target.value) || 10000)
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>{t('timeStep')} (a.u.)</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.timeStep}
                  onChange={(e) =>
                    updateConfig('timeStep', parseFloat(e.target.value) || 5.0)
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>{t('multiplicity')}</label>
                <input
                  type="number"
                  min={1}
                  value={config.multiplicity}
                  onChange={(e) =>
                    updateConfig('multiplicity', parseInt(e.target.value) || 1)
                  }
                  className={inputCls}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Cell parameters */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('stepCell')}</CardTitle>
            <CardDescription>{t('cellDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(['latticeA', 'latticeB', 'latticeC'] as const).map((key) => (
                <div key={key}>
                  <label className={labelCls}>
                    {t(key)} (a.u.)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config[key]}
                    onChange={(e) =>
                      updateConfig(key, parseFloat(e.target.value) || 20.0)
                    }
                    className={inputCls}
                  />
                </div>
              ))}

              {(['cosA', 'cosB', 'cosC'] as const).map((key) => (
                <div key={key}>
                  <label className={labelCls}>{t(key)}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={config[key]}
                    onChange={(e) =>
                      updateConfig(key, parseFloat(e.target.value) || 0)
                    }
                    className={inputCls}
                  />
                </div>
              ))}

              <div>
                <label className={labelCls}>{t('cutoff')} (Ry)</label>
                <input
                  type="number"
                  step="1"
                  value={config.cutoff}
                  onChange={(e) =>
                    updateConfig('cutoff', parseFloat(e.target.value) || 70)
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>{t('emass')} (a.u.)</label>
                <input
                  type="number"
                  step="10"
                  value={config.emass}
                  onChange={(e) =>
                    updateConfig('emass', parseFloat(e.target.value) || 400)
                  }
                  className={inputCls}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Options */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('stepOptions')}</CardTitle>
            <CardDescription>{t('optionsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.generateWavefunction}
                onChange={(e) =>
                  updateConfig('generateWavefunction', e.target.checked)
                }
                className="size-4 rounded border-input"
              />
              <div>
                <span className="text-sm font-medium">
                  {t('generateWavefunction')}
                </span>
                <p className="text-xs text-muted-foreground">
                  {t('generateWavefunctionHint')}
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.generateGaussview}
                onChange={(e) =>
                  updateConfig('generateGaussview', e.target.checked)
                }
                className="size-4 rounded border-input"
              />
              <div>
                <span className="text-sm font-medium">
                  {t('generateGaussview')}
                </span>
                <p className="text-xs text-muted-foreground">
                  {t('generateGaussviewHint')}
                </p>
              </div>
            </label>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('stepReview')}</CardTitle>
            <CardDescription>{t('reviewDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 rounded-md border p-4">
                <h3 className="font-medium">{t('stepMolecule')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('validAtoms', { count: validAtoms.length })}
                </p>
                {config.name && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">{t('simulationName')}:</span>{' '}
                    {config.name}
                  </p>
                )}
              </div>

              <div className="space-y-2 rounded-md border p-4">
                <h3 className="font-medium">{t('stepSimulation')}</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{config.dynamicsType}</Badge>
                  <Badge variant="secondary">{config.functional}</Badge>
                  <Badge variant="outline">{config.temperature} K</Badge>
                  <Badge variant="outline">
                    {config.maxSteps} {t('steps')}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 rounded-md border p-4">
                <h3 className="font-medium">{t('stepCell')}</h3>
                <p className="text-sm text-muted-foreground">
                  {config.latticeA} x {config.latticeB} x {config.latticeC} a.u.
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('cutoff')}: {config.cutoff} Ry | {t('emass')}: {config.emass} a.u.
                </p>
              </div>

              <div className="space-y-2 rounded-md border p-4">
                <h3 className="font-medium">{t('stepOptions')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('generateWavefunction')}:{' '}
                  {config.generateWavefunction ? tCommon('success') : '---'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('generateGaussview')}:{' '}
                  {config.generateGaussview ? tCommon('success') : '---'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {errorMsg && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          <ChevronLeft className="mr-1 size-4" />
          {tCommon('back')}
        </Button>

        {step < TOTAL_STEPS - 1 ? (
          <Button
            disabled={!canProceed()}
            onClick={() => setStep((s) => s + 1)}
          >
            {tCommon('next')}
            <ChevronRight className="ml-1 size-4" />
          </Button>
        ) : (
          <Button
            disabled={submitStatus === 'loading' || !canProceed()}
            onClick={handleSubmit}
          >
            {submitStatus === 'loading' ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {tCommon('loading')}
              </>
            ) : (
              t('generate')
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
