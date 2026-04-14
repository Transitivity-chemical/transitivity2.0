'use client';

import { useMemo, useRef, useState } from 'react';
import { FlaskConical, Loader2, Trash2, Upload } from 'lucide-react';
import { HoverPreviewPopover } from '@/components/common/HoverPreviewPopover';
import { TunnelingPreview } from '@/components/chemistry/previews';
import { FilePicker, type BucketFile } from '@/components/files/FilePicker';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleChart } from '@/components/chemistry/SimpleChart';

type SpeciesRole = 'REACTANT' | 'TRANSITION_STATE' | 'PRODUCT';

type UploadedFile = {
  id: string;
  originalName: string;
};

type ParsedSpeciesData = {
  nAtoms?: number;
  charge?: number;
  multiplicity?: number;
  molecularMassKg?: number;
  scfEnergy?: number | null;
  electronicPlusEnthalpy?: number | null;
  electronicPlusFreeEnergy?: number | null;
  imaginaryFreq?: number | null;
  vibrationalTemps?: number[];
  rotationalTemps?: number[];
  rotationalSymmetryNumber?: number;
};

type WorkspaceSpecies = {
  id: string;
  slotKey: string;
  role: SpeciesRole;
  label: string;
  filename?: string;
  energyInputEnabled: boolean;
  sourceScfEnergy?: number | null;
  parsedData: ParsedSpeciesData;
};

type RateConstantResponse = {
  temperatures: number[];
  rateConstants: Record<string, number[]>;
  activationEnergy?: number;
  forwardBarrier?: number;
  reverseBarrier?: number | null;
  deltaReaction?: number;
  crossoverTemp?: number | null;
  imaginaryFreq?: number | null;
  solventResults?: Record<string, unknown>;
};

type SpeciesSlot = {
  key: string;
  role: SpeciesRole;
  title: string;
};

const TUNNELING_OPTIONS = ['BELL_35', 'BELL_58', 'SKODJE_TRUHLAR', 'ECKART', 'D_TST'] as const;
const SOLVENT_OPTIONS = ['SMOLUCHOWSKI', 'COLLINS_KIMBALL', 'KRAMERS'] as const;
const SPECIES_SLOTS: SpeciesSlot[] = [
  { key: 'reactant-1', role: 'REACTANT', title: 'Reactant 1' },
  { key: 'reactant-2', role: 'REACTANT', title: 'Reactant 2' },
  { key: 'transition-state', role: 'TRANSITION_STATE', title: 'Transition State' },
  { key: 'product-1', role: 'PRODUCT', title: 'Product 1' },
  { key: 'product-2', role: 'PRODUCT', title: 'Product 2' },
];

type TemperatureRow = {
  id: string;
  value: string;
};

let nextTemperatureRowId = 1;
function createTemperatureRow(value = ''): TemperatureRow {
  return {
    id: `temperature-row-${nextTemperatureRowId++}`,
    value,
  };
}

function parseTemperatureRows(rows: TemperatureRow[]) {
  return rows
    .map((row) => Number(row.value.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function formatSpeciesForEndpoint(species: WorkspaceSpecies) {
  const rotationalTemps = species.parsedData.rotationalTemps || [];

  return {
    scfEnergy: species.parsedData.scfEnergy ?? null,
    electronicPlusEnthalpy: species.parsedData.electronicPlusEnthalpy ?? null,
    electronicPlusFreeEnergy: species.parsedData.electronicPlusFreeEnergy ?? null,
    molecularMassKg: species.parsedData.molecularMassKg || 0,
    vibrationalTemps: species.parsedData.vibrationalTemps || [],
    rotationalTemps,
    geometryType: rotationalTemps.length <= 1 ? 'linear' as const : 'nonlinear' as const,
    multiplicity: species.parsedData.multiplicity || 1,
    rotationalSymmetryNumber: species.parsedData.rotationalSymmetryNumber || 1,
    imaginaryFreq: species.parsedData.imaginaryFreq ?? null,
  };
}

function formatMetric(value?: number | null, digits = 3) {
  if (value == null || !Number.isFinite(value)) return '--';
  if (Math.abs(value) >= 1e4 || Math.abs(value) < 1e-2) return value.toExponential(3);
  return value.toFixed(digits);
}

export function RateConstantWorkbench() {
  const t = useTranslations('rateConstant');
  const tCommon = useTranslations('common');

  const [reactionName, setReactionName] = useState('');
  const [reactionType, setReactionType] = useState<'UNIMOLECULAR' | 'BIMOLECULAR'>('BIMOLECULAR');
  const [energyType, setEnergyType] = useState<'En' | 'Ent' | 'EnG'>('En');
  const [species, setSpecies] = useState<WorkspaceSpecies[]>([]);
  const [temperatureRows, setTemperatureRows] = useState<TemperatureRow[]>([
    createTemperatureRow('200'),
    createTemperatureRow('300'),
    createTemperatureRow('400'),
    createTemperatureRow('500'),
    createTemperatureRow('700'),
    createTemperatureRow('1000'),
    createTemperatureRow('1500'),
    createTemperatureRow('2000'),
  ]);
  const [tunnelingMethods, setTunnelingMethods] = useState<string[]>(['BELL_35', 'ECKART']);
  const [dParameter, setDParameter] = useState('0.0');
  const [solventModel, setSolventModel] = useState('none');
  const [solventName, setSolventName] = useState('');
  const [solventViscosity, setSolventViscosity] = useState('0.00089');
  const [radiusA, setRadiusA] = useState('2e-10');
  const [radiusB, setRadiusB] = useState('2e-10');
  const [status, setStatus] = useState<'idle' | 'parsing' | 'loading' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<RateConstantResponse | null>(null);

  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});
  const [pickerSlot, setPickerSlot] = useState<SpeciesSlot | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const speciesRef = useRef<HTMLDivElement | null>(null);
  const solventRef = useRef<HTMLDivElement | null>(null);

  const reactants = species.filter((item) => item.role === 'REACTANT');
  const transitionState = species.find((item) => item.role === 'TRANSITION_STATE') || null;
  const products = species.filter((item) => item.role === 'PRODUCT');
  const temperatures = useMemo(() => parseTemperatureRows(temperatureRows), [temperatureRows]);

  const arrheniusSeries = useMemo(() => {
    if (!result) return [];

    return Object.entries(result.rateConstants || {}).flatMap(([method, values], index) => {
      const validPairs = result.temperatures.flatMap((temperature, itemIndex) => {
        const rateConstant = values[itemIndex];
        if (!Number.isFinite(temperature) || temperature <= 0) return [];
        if (!Number.isFinite(rateConstant) || rateConstant <= 0) return [];

        return [{ x: 1000 / temperature, y: Math.log(rateConstant) }];
      });

      if (validPairs.length === 0) return [];

      return [{
        label: method,
        x: validPairs.map((pair) => pair.x),
        y: validPairs.map((pair) => pair.y),
        type: 'line' as const,
        color: ['#1e3a5f', '#d97706', '#15803d', '#b91c1c', '#7c3aed'][index % 5],
      }];
    });
  }, [result]);

  function getSpeciesForSlot(slotKey: string) {
    return species.find((item) => item.slotKey === slotKey) || null;
  }

  function updateSpeciesField(slotKey: string, field: keyof ParsedSpeciesData, value: number | null) {
    setSpecies((current) =>
      current.map((item) =>
        item.slotKey === slotKey
          ? {
              ...item,
              parsedData: {
                ...item.parsedData,
                [field]: value,
              },
            }
          : item,
      ),
    );
  }

  function toggleSpeciesEnergy(slotKey: string, enabled: boolean) {
    setSpecies((current) =>
      current.map((item) =>
        item.slotKey === slotKey
          ? {
              ...item,
              energyInputEnabled: enabled,
              parsedData: {
                ...item.parsedData,
                scfEnergy: enabled ? item.parsedData.scfEnergy : item.sourceScfEnergy ?? item.parsedData.scfEnergy,
              },
            }
          : item,
      ),
    );
  }

  function scrollToRef(ref: { current: HTMLDivElement | null }) {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const uploadResponse = await fetch('/api/v1/files/upload', {
      method: 'POST',
      body: formData,
    });

    const uploadBody = await uploadResponse.json().catch(() => null);

    if (!uploadResponse.ok) {
      throw new Error(uploadBody?.error || `HTTP ${uploadResponse.status}`);
    }

    return uploadBody as UploadedFile;
  }

  async function parseUploadedFile(fileUploadId: string) {
    const parseResponse = await fetch('/api/v1/files/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileUploadId: fileUploadId }),
    });

    const parseBody = await parseResponse.json().catch(() => null);

    if (!parseResponse.ok) {
      throw new Error(parseBody?.error || `HTTP ${parseResponse.status}`);
    }

    return parseBody as ParsedSpeciesData;
  }

  async function handleSlotBucketFile(slot: SpeciesSlot, bucketFile: BucketFile) {
    setStatus('parsing');
    setErrorMessage('');
    try {
      const parsed = await parseUploadedFile(bucketFile.id);
      setSpecies((current) => {
        const nextSpecies = current.filter((item) => item.slotKey !== slot.key);
        nextSpecies.push({
          id: `${bucketFile.id}-${slot.key}`,
          slotKey: slot.key,
          role: slot.role,
          label: slot.title,
          filename: bucketFile.originalName,
          energyInputEnabled: true,
          sourceScfEnergy: parsed.scfEnergy ?? null,
          parsedData: parsed,
        });
        return nextSpecies;
      });
      setStatus(result ? 'success' : 'idle');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : tCommon('error'));
    }
  }

  async function handleSlotUpload(slot: SpeciesSlot, file: File) {
    setStatus('parsing');
    setErrorMessage('');

    try {
      const upload = await uploadFile(file);
      const parsed = await parseUploadedFile(upload.id);

      setSpecies((current) => {
        const nextSpecies = current.filter((item) => item.slotKey !== slot.key);
        nextSpecies.push({
          id: `${upload.id}-${slot.key}`,
          slotKey: slot.key,
          role: slot.role,
          label: slot.title,
          filename: upload.originalName,
          energyInputEnabled: true,
          sourceScfEnergy: parsed.scfEnergy ?? null,
          parsedData: parsed,
        });
        return nextSpecies;
      });

      setStatus(result ? 'success' : 'idle');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : tCommon('error'));
    }
  }

  function removeSpecies(slotKey: string) {
    setSpecies((current) => current.filter((item) => item.slotKey !== slotKey));
  }

  function updateTemperatureRow(rowId: string, value: string) {
    setTemperatureRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, value } : row)),
    );
  }

  function addTemperatureRow() {
    setTemperatureRows((current) => [...current, createTemperatureRow()]);
  }

  function removeTemperatureRow(rowId: string) {
    setTemperatureRows((current) =>
      current.length <= 1 ? current : current.filter((row) => row.id !== rowId),
    );
  }

  function toggleTunneling(method: string) {
    setTunnelingMethods((current) =>
      current.includes(method) ? current.filter((item) => item !== method) : [...current, method],
    );
  }

  async function handleRun() {
    if (reactants.length === 0) {
      setStatus('error');
      setErrorMessage(t('needReactant'));
      return;
    }

    if (!transitionState) {
      setStatus('error');
      setErrorMessage(t('needTS'));
      return;
    }

    if (temperatures.length === 0) {
      setStatus('error');
      setErrorMessage(t('temperaturesRequired'));
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/v1/rate-constant/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reactants: reactants.map(formatSpeciesForEndpoint),
          ts: formatSpeciesForEndpoint(transitionState),
          products: products.map(formatSpeciesForEndpoint),
          temperatures,
          reactionType,
          energyType,
          tunnelingMethods,
          dParameter: tunnelingMethods.includes('D_TST') ? Number(dParameter) : undefined,
          solventModel:
            reactionType === 'BIMOLECULAR' && solventModel !== 'none' ? solventModel : undefined,
          solventName:
            reactionType === 'BIMOLECULAR' && solventModel !== 'none'
              ? solventName || undefined
              : undefined,
          solventViscosity:
            reactionType === 'BIMOLECULAR' && solventModel !== 'none'
              ? Number(solventViscosity)
              : undefined,
          radiusA:
            reactionType === 'BIMOLECULAR' && solventModel !== 'none'
              ? Number(radiusA)
              : undefined,
          radiusB:
            reactionType === 'BIMOLECULAR' && solventModel !== 'none'
              ? Number(radiusB)
              : undefined,
        }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error || body?.detail || `HTTP ${response.status}`);
      }

      setResult(body.result as RateConstantResponse);
      setStatus('success');
      scrollToRef(summaryRef);
    } catch (error) {
      setStatus('error');
      setResult(null);
      setErrorMessage(error instanceof Error ? error.message : tCommon('error'));
    }
  }

  const loadExample = () => {
    // H + HBr → H2 + Br bimolecular benchmark (Sims et al. 1994).
    // Seed species with synthetic parsed data so the user can press "Calcular" immediately.
    setReactionName('H + HBr');
    setReactionType('BIMOLECULAR');
    setSpecies([
      {
        id: 'sample-h', slotKey: 'reactant-1', role: 'REACTANT', label: 'Reactant 1',
        filename: 'H.log', energyInputEnabled: false, sourceScfEnergy: -0.5,
        parsedData: { nAtoms: 1, multiplicity: 2, molecularMassKg: 1.673e-27,
          scfEnergy: -0.5, vibrationalTemps: [], rotationalTemps: [], rotationalSymmetryNumber: 1 },
      },
      {
        id: 'sample-hbr', slotKey: 'reactant-2', role: 'REACTANT', label: 'Reactant 2',
        filename: 'HBr.log', energyInputEnabled: false, sourceScfEnergy: -2573.86,
        parsedData: { nAtoms: 2, multiplicity: 1, molecularMassKg: 1.344e-25,
          scfEnergy: -2573.86, vibrationalTemps: [3811], rotationalTemps: [12.0], rotationalSymmetryNumber: 1 },
      },
      {
        id: 'sample-ts', slotKey: 'transition-state', role: 'TRANSITION_STATE', label: 'Transition State',
        filename: 'H_HBr_TS.log', energyInputEnabled: false, sourceScfEnergy: -2574.35,
        parsedData: { nAtoms: 3, multiplicity: 2, molecularMassKg: 1.361e-25,
          scfEnergy: -2574.35, vibrationalTemps: [2800, 600], rotationalTemps: [2.5, 0.8],
          rotationalSymmetryNumber: 1, imaginaryFreq: -1200 },
      },
      {
        id: 'sample-h2', slotKey: 'product-1', role: 'PRODUCT', label: 'Product 1',
        filename: 'H2.log', energyInputEnabled: false, sourceScfEnergy: -1.17,
        parsedData: { nAtoms: 2, multiplicity: 1, molecularMassKg: 3.347e-27,
          scfEnergy: -1.17, vibrationalTemps: [6338], rotationalTemps: [87.6], rotationalSymmetryNumber: 2 },
      },
      {
        id: 'sample-br', slotKey: 'product-2', role: 'PRODUCT', label: 'Product 2',
        filename: 'Br.log', energyInputEnabled: false, sourceScfEnergy: -2573.19,
        parsedData: { nAtoms: 1, multiplicity: 2, molecularMassKg: 1.327e-25,
          scfEnergy: -2573.19, vibrationalTemps: [], rotationalTemps: [], rotationalSymmetryNumber: 1 },
      },
    ]);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={loadExample}>
          <FlaskConical className="mr-1.5 h-4 w-4" />
          Carregar exemplo · H + HBr
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border/70 bg-background shadow-sm">
        <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mb-6 grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5 lg:grid-cols-[minmax(0,1fr)_220px_220px] lg:items-end">
            <div className="min-w-0">
              <Label htmlFor="reaction-name">{t('reactionName')}</Label>
              <Input
                id="reaction-name"
                value={reactionName}
                onChange={(event) => setReactionName(event.target.value)}
                placeholder="OH + H2 -> H2O + H"
                className="mt-1 bg-background"
              />
            </div>
            <div className="w-full">
              <Label htmlFor="reaction-type">{t('reactionType')}</Label>
              <select
                id="reaction-type"
                value={reactionType}
                onChange={(event) => setReactionType(event.target.value as typeof reactionType)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="UNIMOLECULAR">{t('unimolecular')}</option>
                <option value="BIMOLECULAR">{t('bimolecular')}</option>
              </select>
            </div>
            <div className="w-full">
              <Label htmlFor="energy-type">{t('energyType')}</Label>
              <select
                id="energy-type"
                value={energyType}
                onChange={(event) => setEnergyType(event.target.value as typeof energyType)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="En">E (SCF Energy)</option>
                <option value="Ent">E + H (Enthalpy)</option>
                <option value="EnG">E + G (Free Energy)</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {SPECIES_SLOTS.map((slot) => {
                const slotSpecies = getSpeciesForSlot(slot.key);

                return (
                  <div
                    key={slot.key}
                    className="rounded-2xl border border-border bg-card shadow-sm transition hover:border-primary/20"
                  >
                    <div className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
                      {slot.title}
                    </div>
                    <div className="flex h-full flex-col gap-3 p-4">
                      <button
                        type="button"
                        onClick={() => setPickerSlot(slot)}
                        className="w-full rounded-lg border border-input bg-background px-5 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-muted/60"
                      >
                        Open File
                      </button>

                      <div className="rounded-lg border border-border bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
                        {slotSpecies?.filename || 'No file selected'}
                      </div>

                      <div className="space-y-1">
                        <label className="flex items-center gap-2 text-sm text-foreground">
                          <input
                            type="checkbox"
                            checked={slotSpecies?.energyInputEnabled ?? false}
                            disabled={!slotSpecies}
                            onChange={(event) => toggleSpeciesEnergy(slot.key, event.target.checked)}
                            className="size-3.5"
                          />
                          Set Energy (a.u.)
                        </label>
                        <Input
                          type="number"
                          value={slotSpecies?.parsedData.scfEnergy ?? ''}
                          onChange={(event) =>
                            updateSpeciesField(
                              slot.key,
                              'scfEnergy',
                              event.target.value === '' ? null : Number(event.target.value),
                            )
                          }
                          disabled={!slotSpecies || !slotSpecies.energyInputEnabled}
                          className="h-9 bg-background text-sm"
                        />
                      </div>

                      {slotSpecies && (
                        <div className="flex-1 rounded-lg border border-border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                          <div className="space-y-0.5">
                            <p>Multiplicity: {slotSpecies.parsedData.multiplicity || 1}</p>
                            <p>Mass: {formatMetric(slotSpecies.parsedData.molecularMassKg, 4)} kg</p>
                            <p>
                              Imag. freq:{' '}
                              {slotSpecies.parsedData.imaginaryFreq != null
                                ? formatMetric(slotSpecies.parsedData.imaginaryFreq, 1)
                                : '--'}
                            </p>
                          </div>
                        </div>
                      )}

                      {slotSpecies && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSpecies(slot.key)}
                          className="w-full justify-center text-muted-foreground hover:text-foreground"
                        >
                          <Trash2 className="mr-1 size-4" />
                          {t('removeSpecies')}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-[minmax(0,280px)_minmax(0,280px)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <Label htmlFor="temperatures" className="text-base text-foreground">
                Set Temperature
              </Label>
              <div className="mt-3 space-y-3">
                <div className="flex justify-end">
                  <Button type="button" size="sm" variant="outline" onClick={addTemperatureRow}>
                    + Add Row
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="px-3 py-2 text-left font-medium">#</th>
                        <th className="px-3 py-2 text-left font-medium">{t('temperaturesField')} (K)</th>
                        <th className="px-3 py-2 text-right font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {temperatureRows.map((row, index) => (
                        <tr key={row.id} className="border-b border-border/60 last:border-b-0">
                          <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                          <td className="px-3 py-2">
                            <input
                              id={index === 0 ? 'temperatures' : undefined}
                              type="text"
                              inputMode="decimal"
                              value={row.value}
                              onChange={(event) => updateTemperatureRow(row.id, event.target.value)}
                              placeholder="e.g. 300"
                              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTemperatureRow(row.id)}
                              disabled={temperatureRows.length <= 1}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked readOnly className="size-3.5" />
                Default Temperature Range
              </label>
              <p className="mt-2 text-xs text-muted-foreground">{t('temperaturesHint')}</p>
            </div>

            <div className="rounded-lg border border-border bg-card/90 p-4 shadow-sm">
              <div className="space-y-5">
                <Button
                  type="button"
                  onClick={handleRun}
                  disabled={status === 'loading' || status === 'parsing'}
                  className="mx-auto flex h-14 w-full rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 sm:w-auto sm:min-w-[170px] sm:px-8 sm:text-lg"
                >
                  {status === 'loading' || status === 'parsing' ? (
                    <>
                      <Loader2 className="mr-2 size-5 animate-spin" />
                      {status === 'parsing' ? t('parsing') : t('computing')}
                    </>
                  ) : (
                    <>
                      <FlaskConical className="mr-2 size-5" />
                      Calculate
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => scrollToRef(speciesRef)}
                  className="mx-auto flex min-h-[54px] w-full whitespace-normal text-center sm:max-w-[210px]"
                >
                  Quick Check on
                  <br />
                  Species Properties
                </Button>

                {errorMessage && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive shadow-sm">
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm lg:col-span-2 xl:col-span-1">
              <Button type="button" variant="outline" className="w-full" onClick={() => scrollToRef(speciesRef)}>
                Species Properties
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => scrollToRef(summaryRef)}>
                Reaction Properties
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => scrollToRef(solventRef)}>
                Solvent Effect
              </Button>

            <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4 shadow-sm">
                <div>
                  <Label className="flex items-center gap-1">
                    {t('tunneling')}
                    <HoverPreviewPopover
                      preview={TunnelingPreview}
                      title="Quantum tunneling"
                      description="Particles pass through the activation barrier instead of going over it. Bell, Eckart and Wigner correct the TST rate for this effect."
                    />
                  </Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {TUNNELING_OPTIONS.map((method) => {
                      const selected = tunnelingMethods.includes(method);

                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => toggleTunneling(method)}
                          aria-pressed={selected}
                          className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition ${
                            selected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-input bg-background text-muted-foreground hover:border-primary/50'
                          }`}
                        >
                          {method.replace(/_/g, ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {tunnelingMethods.includes('D_TST') && (
                  <div>
                    <Label htmlFor="d-parameter">{t('dParameter')}</Label>
                    <Input
                      id="d-parameter"
                      type="number"
                      value={dParameter}
                      onChange={(event) => setDParameter(event.target.value)}
                      className="mt-1 bg-background"
                    />
                  </div>
                )}

                <div ref={solventRef}>
                  <Label htmlFor="solvent-model">{t('solvent')}</Label>
                  <select
                    id="solvent-model"
                    value={solventModel}
                    onChange={(event) => setSolventModel(event.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="none">{t('noSolvent')}</option>
                    {SOLVENT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {reactionType === 'BIMOLECULAR' && solventModel !== 'none' && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="solvent-name">{t('solventName')}</Label>
                      <Input
                        id="solvent-name"
                        value={solventName}
                        onChange={(event) => setSolventName(event.target.value)}
                        placeholder="water"
                        className="mt-1 bg-background"
                      />
                    </div>
                    <div>
                      <Label htmlFor="solvent-viscosity">{t('solventViscosity')}</Label>
                      <Input
                        id="solvent-viscosity"
                        type="number"
                        value={solventViscosity}
                        onChange={(event) => setSolventViscosity(event.target.value)}
                        className="mt-1 bg-background"
                      />
                    </div>
                    <div>
                      <Label htmlFor="radius-a">{t('radiusA')}</Label>
                      <Input
                        id="radius-a"
                        type="number"
                        value={radiusA}
                        onChange={(event) => setRadiusA(event.target.value)}
                        className="mt-1 bg-background"
                      />
                    </div>
                    <div>
                      <Label htmlFor="radius-b">{t('radiusB')}</Label>
                      <Input
                        id="radius-b"
                        type="number"
                        value={radiusB}
                        onChange={(event) => setRadiusB(event.target.value)}
                        className="mt-1 bg-background"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={summaryRef} className="grid gap-6 items-start lg:grid-cols-1 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('resultsSummary')}</CardTitle>
              <CardDescription>{t('resultsSummaryDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="rounded-lg border border-dashed border-border shadow-sm px-4 py-10 text-center text-sm text-muted-foreground">
                  <Upload className="mx-auto mb-3 size-8 opacity-60" />
                  {t('noEndpointResult')}
                </div>
              ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground">{t('forwardBarrier')}</p>
                      <p className="mt-1 text-lg font-semibold">{formatMetric(result.forwardBarrier)} kJ/mol</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card/90 shadow-sm p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t('reverseBarrier')}
                    </p>
                    <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-primary">
                      {formatMetric(result.reverseBarrier)} kJ/mol
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card/90 shadow-sm p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t('crossoverTemp')}
                    </p>
                    <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-primary">
                      {formatMetric(result.crossoverTemp)} K
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card/90 shadow-sm p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t('imagFreq')}
                    </p>
                    <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-primary">
                      {formatMetric(result.imaginaryFreq)} cm^-1
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div ref={speciesRef}>
            <Card>
            <CardHeader>
              <CardTitle>{t('speciesSnapshot')}</CardTitle>
              <CardDescription>{t('speciesSnapshotDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {species.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border shadow-sm px-4 py-8 text-sm text-muted-foreground">
                  {t('noSpeciesLoaded')}
                </div>
              ) : (
                species.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border bg-card/90 shadow-sm p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-sm bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                        {item.label}
                      </span>
                      <span className="min-w-0 break-all text-sm font-medium sm:text-base">{item.filename}</span>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <p>SCF: {formatMetric(item.parsedData.scfEnergy, 6)}</p>
                      <p>Enthalpy: {formatMetric(item.parsedData.electronicPlusEnthalpy, 6)}</p>
                      <p>Free energy: {formatMetric(item.parsedData.electronicPlusFreeEnergy, 6)}</p>
                      <p>Mass (kg): {formatMetric(item.parsedData.molecularMassKg, 4)}</p>
                      <p>Vib temps: {(item.parsedData.vibrationalTemps || []).length}</p>
                      <p>Rot temps: {(item.parsedData.rotationalTemps || []).length}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('arrheniusPlot')}</CardTitle>
              <CardDescription>{t('arrheniusPlotDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {arrheniusSeries.length > 0 ? (
                <SimpleChart
                  series={arrheniusSeries}
                  xLabel="1000 / T (K^-1)"
                  yLabel="ln(k)"
                  title={reactionName || t('title')}
                />
              ) : (
                <div className="rounded-lg border border-dashed border-border shadow-sm px-4 py-8 text-sm text-muted-foreground">
                  {t('noPlotData')}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('rateConstantsResponse')}</CardTitle>
              <CardDescription>{t('rateConstantsResponseDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="rounded-lg border border-dashed border-border shadow-sm px-4 py-8 text-sm text-muted-foreground">
                  {t('noEndpointResult')}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-3 py-2 text-left font-medium">T (K)</th>
                        {Object.keys(result.rateConstants).map((method) => (
                          <th key={method} className="px-3 py-2 text-right font-medium">
                            k<sub>{method}</sub>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.temperatures.map((temperature, index) => (
                        <tr key={`${temperature}-${index}`} className="border-b border-border/60">
                          <td className="px-3 py-2 font-mono">{temperature}</td>
                          {Object.entries(result.rateConstants).map(([method, values]) => (
                            <td key={`${method}-${index}`} className="px-3 py-2 text-right font-mono text-xs">
                              {Number.isFinite(values[index]) ? values[index].toExponential(4) : '--'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <FilePicker
        open={pickerSlot !== null}
        onOpenChange={(o) => !o && setPickerSlot(null)}
        onSelect={(f) => {
          const slot = pickerSlot;
          setPickerSlot(null);
          if (slot) void handleSlotBucketFile(slot, f);
        }}
        accept={['.log', '.out', '.gjf', '.com', '.xyz', '.mol']}
        title={pickerSlot ? `${pickerSlot.title}: escolher arquivo` : 'Escolher arquivo'}
        description="Escolha um arquivo já enviado ou clique em Enviar para adicionar um novo."
      />
    </div>
  );
}
