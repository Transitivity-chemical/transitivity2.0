'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileDropzone } from '@/components/chemistry/FileDropzone';
import { Upload, Trash2, Plus, ChevronRight, ChevronLeft, Loader2, FlaskConical } from 'lucide-react';
import { SAMPLE_RATE_CONSTANT_DATA } from '@/lib/sample-data';
import { formatEnergy } from '@/lib/format-scientific';

type SpeciesRole = 'REACTANT' | 'TRANSITION_STATE' | 'PRODUCT';

interface ParsedSpecies {
  role: SpeciesRole;
  label: string;
  fileUploadId?: string;
  filename?: string;
  parsedData?: Record<string, unknown>;
  scfEnergy?: number;
  nAtoms?: number;
  charge?: number;
  multiplicity?: number;
}

const STEPS = ['setup', 'species', 'temperatures', 'review'] as const;
type Step = (typeof STEPS)[number];

export function ReactionWizard() {
  const t = useTranslations('rateConstant');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];

  const [step, setStep] = useState<Step>('setup');
  const [name, setName] = useState('');
  const [reactionType, setReactionType] = useState<'UNIMOLECULAR' | 'BIMOLECULAR'>('BIMOLECULAR');
  const [energyType, setEnergyType] = useState<'En' | 'Ent' | 'EnG'>('En');

  const [species, setSpecies] = useState<ParsedSpecies[]>([]);
  const [parsingFile, setParsingFile] = useState(false);
  const [addingRole, setAddingRole] = useState<SpeciesRole>('REACTANT');

  // Temperature grid
  const [gridType, setGridType] = useState<'RANGE' | 'CUSTOM' | 'DEFAULT'>('RANGE');
  const [minTemp, setMinTemp] = useState('200');
  const [maxTemp, setMaxTemp] = useState('2000');
  const [tempStep, setTempStep] = useState('50');
  const [customTemps, setCustomTemps] = useState('');

  // Tunneling & solvent
  const [tunnelingMethods, setTunnelingMethods] = useState<string[]>([
    'BELL_35',
    'ECKART',
  ]);
  const [solventModel, setSolventModel] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentStepIndex = STEPS.indexOf(step);

  const handleFileUploaded = useCallback(
    async (file: { id: string; originalName: string }) => {
      setParsingFile(true);
      setError('');
      try {
        const parseRes = await fetch('/api/v1/files/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUploadId: file.id }),
        });

        if (!parseRes.ok) {
          const err = await parseRes.json();
          throw new Error(err.error || 'Parse failed');
        }

        const parsed = await parseRes.json();

        setSpecies((prev) => [
          ...prev,
          {
            role: addingRole,
            label: file.originalName.replace(/\.[^.]+$/, ''),
            fileUploadId: file.id,
            filename: file.originalName,
            parsedData: parsed,
            scfEnergy: parsed.scfEnergy,
            nAtoms: parsed.nAtoms,
            charge: parsed.charge,
            multiplicity: parsed.multiplicity,
          },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Parse failed');
      } finally {
        setParsingFile(false);
      }
    },
    [addingRole],
  );

  const removeSpecies = (index: number) => {
    setSpecies((prev) => prev.filter((_, i) => i !== index));
  };

  const hasTS = species.some((s) => s.role === 'TRANSITION_STATE');
  const hasReactant = species.some((s) => s.role === 'REACTANT');

  const canProceedFromSpecies = hasTS && hasReactant;

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError('');

    try {
      // 1. Create reaction
      const rxnRes = await fetch('/api/v1/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, reactionType, energyType }),
      });

      if (!rxnRes.ok) throw new Error('Failed to create reaction');
      const reaction = await rxnRes.json();

      // 2. Add species
      for (const sp of species) {
        await fetch(`/api/v1/reactions/${reaction.id}/species`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: sp.role,
            label: sp.label,
            fileUploadId: sp.fileUploadId,
            parsedData: sp.parsedData,
          }),
        });
      }

      // 3. Set temperature grid
      let temperatures: number[] = [];
      if (gridType === 'DEFAULT') {
        for (let t = 200; t <= 2000; t += 50) temperatures.push(t);
      } else if (gridType === 'RANGE') {
        const min = parseFloat(minTemp);
        const max = parseFloat(maxTemp);
        const s = parseFloat(tempStep);
        for (let t = min; t <= max; t += s) temperatures.push(Math.round(t * 100) / 100);
      } else {
        temperatures = customTemps
          .split(/[,;\s\n]+/)
          .map((v) => parseFloat(v.trim()))
          .filter((v) => !isNaN(v) && v > 0);
      }

      await fetch(`/api/v1/reactions/${reaction.id}/temperature-grid`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gridType, minTemp: parseFloat(minTemp), maxTemp: parseFloat(maxTemp), step: parseFloat(tempStep), values: temperatures }),
      });

      // 4. Compute rate constants
      const computeRes = await fetch(`/api/v1/reactions/${reaction.id}/compute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tunnelingMethods, solventModel: solventModel || undefined }),
      });

      if (!computeRes.ok) {
        const err = await computeRes.json();
        throw new Error(err.error || 'Computation failed');
      }

      // Navigate to results
      router.push(`/${locale}/rate-constant/${reaction.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
      setSubmitting(false);
    }
  }, [name, reactionType, energyType, species, gridType, minTemp, maxTemp, tempStep, customTemps, tunnelingMethods, solventModel, router, locale]);

  const toggleTunneling = (method: string) => {
    setTunnelingMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method],
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Load Example */}
      <div className="flex items-center gap-3 mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const d = SAMPLE_RATE_CONSTANT_DATA;
            setName(d.name);
            setReactionType(d.reactionType);
            setEnergyType(d.energyType);
            setSpecies(
              d.species.map((sp) => ({
                role: sp.role,
                label: sp.label,
                scfEnergy: sp.scfEnergy,
                nAtoms: sp.nAtoms,
                charge: sp.charge,
                multiplicity: sp.multiplicity,
              })),
            );
            setStep('species');
          }}
        >
          <FlaskConical className="mr-1.5 size-4" />
          Load Example
        </Button>
        <span className="text-xs text-muted-foreground">
          OH + HCl reaction (bimolecular, gas-phase)
        </span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => i < currentStepIndex && setStep(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                s === step
                  ? 'bg-primary text-primary-foreground'
                  : i < currentStepIndex
                    ? 'bg-primary/20 text-primary cursor-pointer'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1}. {t(`step_${s}`)}
            </button>
            {i < STEPS.length - 1 && <ChevronRight className="size-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 1: Setup */}
      {step === 'setup' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('step_setup')}</CardTitle>
            <CardDescription>{t('setupDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('reactionName')}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. OH + H₂ → H₂O + H"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>{t('reactionType')}</Label>
                <Select value={reactionType} onValueChange={(v) => setReactionType(v as typeof reactionType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNIMOLECULAR">{t('unimolecular')}</SelectItem>
                    <SelectItem value="BIMOLECULAR">{t('bimolecular')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('energyType')}</Label>
                <Select value={energyType} onValueChange={(v) => setEnergyType(v as typeof energyType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="En">E (SCF Energy)</SelectItem>
                    <SelectItem value="Ent">E + H (Enthalpy)</SelectItem>
                    <SelectItem value="EnG">E + G (Free Energy)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep('species')} disabled={!name.trim()}>
                {tCommon('next')} <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Species */}
      {step === 'species' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('step_species')}</CardTitle>
            <CardDescription>{t('speciesDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current species */}
            {species.length > 0 && (
              <div className="space-y-2">
                {species.map((sp, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border px-4 py-2"
                  >
                    <div>
                      <span className="text-xs font-medium uppercase text-muted-foreground">
                        {sp.role.replace('_', ' ')}
                      </span>
                      <p className="text-sm font-medium">{sp.label}</p>
                      {sp.scfEnergy && (
                        <p className="text-xs text-muted-foreground">
                          E = {formatEnergy(sp.scfEnergy)} Hartree | {sp.nAtoms} atoms
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeSpecies(i)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add species */}
            <div className="space-y-3 rounded-lg border border-dashed p-4">
              <div className="flex items-center gap-3">
                <Label>{t('addAs')}</Label>
                <Select value={addingRole} onValueChange={(v) => setAddingRole(v as SpeciesRole)}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REACTANT">{t('reactant')}</SelectItem>
                    <SelectItem value="TRANSITION_STATE">{t('transitionState')}</SelectItem>
                    <SelectItem value="PRODUCT">{t('product')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {parsingFile ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> {t('parsing')}
                </div>
              ) : (
                <FileDropzone onUploadComplete={handleFileUploaded} className="py-6" />
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {!hasReactant && (
              <p className="text-xs text-amber-600">{t('needReactant')}</p>
            )}
            {!hasTS && (
              <p className="text-xs text-amber-600">{t('needTS')}</p>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('setup')}>
                <ChevronLeft className="mr-1 size-4" /> {tCommon('back')}
              </Button>
              <Button onClick={() => setStep('temperatures')} disabled={!canProceedFromSpecies}>
                {tCommon('next')} <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Temperatures & Options */}
      {step === 'temperatures' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('step_temperatures')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Temperature Grid */}
            <div className="space-y-3">
              <Label>{t('tempGrid')}</Label>
              <Select value={gridType} onValueChange={(v) => setGridType(v as typeof gridType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEFAULT">{t('tempDefault')}</SelectItem>
                  <SelectItem value="RANGE">{t('tempRange')}</SelectItem>
                  <SelectItem value="CUSTOM">{t('tempCustom')}</SelectItem>
                </SelectContent>
              </Select>

              {gridType === 'RANGE' && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label className="text-xs">Min (K)</Label>
                    <Input value={minTemp} onChange={(e) => setMinTemp(e.target.value)} type="number" />
                  </div>
                  <div>
                    <Label className="text-xs">Max (K)</Label>
                    <Input value={maxTemp} onChange={(e) => setMaxTemp(e.target.value)} type="number" />
                  </div>
                  <div>
                    <Label className="text-xs">Step (K)</Label>
                    <Input value={tempStep} onChange={(e) => setTempStep(e.target.value)} type="number" />
                  </div>
                </div>
              )}

              {gridType === 'CUSTOM' && (
                <div>
                  <Label className="text-xs">{t('customTempsHint')}</Label>
                  <textarea
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    rows={3}
                    value={customTemps}
                    onChange={(e) => setCustomTemps(e.target.value)}
                    placeholder="200, 300, 400, 500, 600, 800, 1000, 1500, 2000"
                  />
                </div>
              )}
            </div>

            {/* Tunneling */}
            <div className="space-y-3">
              <Label>{t('tunneling')}</Label>
              <div className="flex flex-wrap gap-2">
                {['BELL_35', 'BELL_58', 'SKODJE_TRUHLAR', 'ECKART', 'D_TST'].map((m) => (
                  <button
                    key={m}
                    onClick={() => toggleTunneling(m)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                      tunnelingMethods.includes(m)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-input hover:border-primary/50'
                    }`}
                  >
                    {m.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Solvent */}
            {reactionType === 'BIMOLECULAR' && (
              <div className="space-y-3">
                <Label>{t('solvent')}</Label>
                <Select value={solventModel} onValueChange={setSolventModel}>
                  <SelectTrigger><SelectValue placeholder={t('noSolvent')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('noSolvent')}</SelectItem>
                    <SelectItem value="SMOLUCHOWSKI">Smoluchowski</SelectItem>
                    <SelectItem value="COLLINS_KIMBALL">Collins-Kimball</SelectItem>
                    <SelectItem value="KRAMERS">Kramers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('species')}>
                <ChevronLeft className="mr-1 size-4" /> {tCommon('back')}
              </Button>
              <Button onClick={() => setStep('review')}>
                {tCommon('next')} <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Compute */}
      {step === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('step_review')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
              <p><strong>{t('reactionName')}:</strong> {name}</p>
              <p><strong>{t('reactionType')}:</strong> {reactionType}</p>
              <p><strong>{t('energyType')}:</strong> {energyType}</p>
              <p>
                <strong>{t('step_species')}:</strong>{' '}
                {species.filter((s) => s.role === 'REACTANT').length} reactants,{' '}
                {species.filter((s) => s.role === 'TRANSITION_STATE').length} TS,{' '}
                {species.filter((s) => s.role === 'PRODUCT').length} products
              </p>
              <p><strong>{t('tunneling')}:</strong> {tunnelingMethods.join(', ') || 'None'}</p>
              {solventModel && solventModel !== 'none' && (
                <p><strong>{t('solvent')}:</strong> {solventModel}</p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('temperatures')}>
                <ChevronLeft className="mr-1 size-4" /> {tCommon('back')}
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> {t('computing')}
                  </>
                ) : (
                  <>
                    {t('compute')} <ChevronRight className="ml-1 size-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
