'use client';

import { useMemo, useState } from 'react';
import { Lock, Unlock, FlaskConical, Orbit, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataEntryTable, createEmptyRow, type DataPoint } from '@/components/chemistry/DataEntryTable';
import { SimpleChart } from '@/components/chemistry/SimpleChart';
import { THEORY_CONFIG, type FittingRunRequest, type FittingTheory } from '@/lib/fitting-api';

type ValidationError = {
  rowId: string;
  field: 'temperature' | 'rateConstant';
  message: string;
};

type FitResponse = {
  theory: string;
  chi_square: number;
  parameters: Record<string, number>;
  curve: {
    temperature: number[];
    inv_temperature: number[];
    k_exp: number[];
    ln_k_exp: number[];
    ln_k_fit: number[];
  };
};

const THEORY_OPTIONS: FittingTheory[] = [
  'Arrhenius',
  'Aquilanti-Mundim',
  'NTS',
  'VFT',
  'ASCC',
];

const DEFAULT_GSA = {
  qA: 1.1,
  qT: 1.5,
  qV: 1.1,
  T0: 1.0,
  F: 1.0,
  NStopMax: 10000,
};

function formatScientific(value: number) {
  if (!Number.isFinite(value)) return '--';
  if (Math.abs(value) >= 1e4 || Math.abs(value) < 1e-2) return value.toExponential(4);
  return value.toFixed(6);
}

export function FittingWorkbench() {
  const t = useTranslations('fittingWizard');
  const tFitting = useTranslations('fitting');
  const tCommon = useTranslations('common');

  const [points, setPoints] = useState<DataPoint[]>([
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [theory, setTheory] = useState<FittingTheory>('Aquilanti-Mundim');
  const [initialParams, setInitialParams] = useState<number[]>(THEORY_CONFIG['Aquilanti-Mundim'].initialParams);
  const [locks, setLocks] = useState<boolean[]>(THEORY_CONFIG['Aquilanti-Mundim'].lock);
  const [gsa, setGsa] = useState(DEFAULT_GSA);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<FitResponse | null>(null);

  const theoryConfig = THEORY_CONFIG[theory];
  const filledPointCount = useMemo(
    () =>
      points.filter(
        (point) => point.temperature.trim() !== '' || point.rateConstant.trim() !== '',
      ).length,
    [points],
  );
  const unlockedParamsCount = useMemo(
    () => locks.filter((item) => !item).length,
    [locks],
  );

  const arrheniusSeries = useMemo(() => {
    if (!result) return [];

    return [
      {
        label: t('experimental'),
        x: result.curve.inv_temperature.map((value) => value * 1000),
        y: result.curve.ln_k_exp,
        type: 'scatter' as const,
        color: '#1e3a5f',
      },
      {
        label: result.theory,
        x: result.curve.inv_temperature.map((value) => value * 1000),
        y: result.curve.ln_k_fit,
        type: 'line' as const,
        color: '#d97706',
      },
    ];
  }, [result, t]);

  function handleTheoryChange(nextTheory: FittingTheory) {
    setTheory(nextTheory);
    setInitialParams(THEORY_CONFIG[nextTheory].initialParams);
    setLocks(THEORY_CONFIG[nextTheory].lock);
    setResult(null);
    setErrorMessage('');
    setStatus('idle');
  }

  function updateInitialParam(index: number, value: string) {
    setInitialParams((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? Number(value) : item)),
    );
  }

  function toggleLock(index: number) {
    setLocks((current) => current.map((item, itemIndex) => (itemIndex === index ? !item : item)));
  }

  function updateGsa<K extends keyof typeof DEFAULT_GSA>(key: K, value: string) {
    setGsa((current) => ({
      ...current,
      [key]: key === 'NStopMax' ? Math.max(1, Number(value)) : Number(value),
    }));
  }

  function getValidPoints() {
    const errors: ValidationError[] = [];
    const validPoints = points.flatMap((point) => {
      const temperature = Number(point.temperature);
      const rateConstant = Number(point.rateConstant);

      if (point.temperature.trim() === '' && point.rateConstant.trim() === '') {
        return [];
      }

      if (!Number.isFinite(temperature) || temperature <= 0) {
        errors.push({
          rowId: point.id,
          field: 'temperature',
          message: 'T > 0',
        });
      }

      if (!Number.isFinite(rateConstant) || rateConstant <= 0) {
        errors.push({
          rowId: point.id,
          field: 'rateConstant',
          message: 'k > 0',
        });
      }

      if (
        Number.isFinite(temperature) &&
        temperature > 0 &&
        Number.isFinite(rateConstant) &&
        rateConstant > 0
      ) {
        return [{ temperature, rateConstant }];
      }

      return [];
    });

    setValidationErrors(errors);
    return { validPoints, errors };
  }

  async function handleRunFitting() {
    const { validPoints, errors } = getValidPoints();

    if (errors.length > 0) {
      setStatus('error');
      setErrorMessage(tFitting('minPoints'));
      return;
    }

    if (validPoints.length < 2) {
      setStatus('error');
      setErrorMessage(t('fittingMinPoints'));
      return;
    }

    const payload: FittingRunRequest = {
      temperatures: validPoints.map((point) => point.temperature),
      rate_constants: validPoints.map((point) => point.rateConstant),
      theory,
      initial_params: initialParams,
      lock: locks,
      gsa,
    };

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/v1/fitting/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error || body?.detail || `HTTP ${response.status}`);
      }

      setResult(body.result as FitResponse);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setResult(null);
      setErrorMessage(error instanceof Error ? error.message : tCommon('error'));
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('endpointData')}</CardTitle>
          <CardDescription>{t('endpointDataDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <DataEntryTable
            points={points}
            onChange={setPoints}
            errors={validationErrors}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{t('theorySetup')}</CardTitle>
            <CardDescription>{t('theorySetupDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t('theoryField')}</label>
              <select
                value={theory}
                onChange={(event) => handleTheoryChange(event.target.value as FittingTheory)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                {THEORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {theoryConfig.labels.map((label, index) => (
                <div key={label} className="rounded-xl border border-border bg-card p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{label}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => toggleLock(index)}
                      aria-label={locks[index] ? t('unlockParameter') : t('lockParameter')}
                    >
                      {locks[index] ? <Lock /> : <Unlock />}
                    </Button>
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    value={initialParams[index]}
                    onChange={(event) => updateInitialParam(index, event.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {locks[index] ? t('parameterLocked') : t('parameterUnlocked')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('gsaFields')}</CardTitle>
            <CardDescription>{t('gsaFieldsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {[
              ['qA', 'qA'],
              ['qT', 'qT'],
              ['qV', 'qV'],
              ['T0', 'T0'],
              ['F', 'F'],
              ['NStopMax', 'NStopMax'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="mb-1.5 block text-sm font-medium">{label}</label>
                <input
                  type="number"
                  step={key === 'NStopMax' ? 1 : 0.1}
                  min={key === 'NStopMax' ? 1 : undefined}
                  value={gsa[key as keyof typeof gsa]}
                  onChange={(event) =>
                    updateGsa(key as keyof typeof DEFAULT_GSA, event.target.value)
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>{t('runEndpointFit')}</CardTitle>
              <CardDescription>{t('endpointOutputDesc')}</CardDescription>
            </div>
            <Button onClick={handleRunFitting} disabled={status === 'loading'} className="w-full sm:w-auto">
              {status === 'loading' ? (
                <>
                  <RefreshCw className="animate-spin" />
                  {tCommon('loading')}
                </>
              ) : (
                <>
                  <FlaskConical />
                  {t('runEndpointFit')}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('pointsLoaded')}
              </p>
              <p className="mt-2 text-2xl font-semibold">{filledPointCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('theoryField')}
              </p>
              <p className="mt-2 text-sm font-semibold">{theory}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('notesParameters')}
              </p>
              <p className="mt-2 text-sm font-semibold">
                {unlockedParamsCount} / {locks.length}
              </p>
            </div>
          </div>

          {status === 'success' && !errorMessage && (
            <p className="text-sm text-green-600 dark:text-green-400">{t('fitSuccess')}</p>
          )}

          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('endpointOutput')}</CardTitle>
          <CardDescription>{t('endpointOutputDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!result ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-5 py-12 text-center">
              <Orbit className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('noEndpointResult')}</p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('theoryField')}
                  </p>
                  <p className="mt-2 text-sm font-semibold">{result.theory}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Chi-square
                  </p>
                  <p className="mt-2 text-sm font-semibold">{formatScientific(result.chi_square)}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('pointsLoaded')}
                  </p>
                  <p className="mt-2 text-sm font-semibold">{result.curve.temperature.length}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Object.entries(result.parameters).map(([name, value]) => (
                  <div key={name} className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{name}</p>
                    <p className="mt-2 font-mono text-sm font-semibold">{formatScientific(value)}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-border bg-card p-3">
                <SimpleChart
                  series={arrheniusSeries}
                  xLabel="1000/T (K^-1)"
                  yLabel="ln(k)"
                  title={t('arrheniusPlot')}
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-3 py-2 text-left font-medium">{tFitting('temperature')} (K)</th>
                      <th className="px-3 py-2 text-left font-medium">1/T</th>
                      <th className="px-3 py-2 text-left font-medium">k exp</th>
                      <th className="px-3 py-2 text-left font-medium">ln(k) exp</th>
                      <th className="px-3 py-2 text-left font-medium">ln(k) fit</th>
                      <th className="px-3 py-2 text-left font-medium">k fit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.curve.temperature.map((temperature, index) => (
                      <tr key={`${temperature}-${index}`} className="border-b last:border-b-0">
                        <td className="px-3 py-2 font-mono text-xs">{formatScientific(temperature)}</td>
                        <td className="px-3 py-2 font-mono text-xs">{formatScientific(result.curve.inv_temperature[index])}</td>
                        <td className="px-3 py-2 font-mono text-xs">{formatScientific(result.curve.k_exp[index])}</td>
                        <td className="px-3 py-2 font-mono text-xs">{formatScientific(result.curve.ln_k_exp[index])}</td>
                        <td className="px-3 py-2 font-mono text-xs">{formatScientific(result.curve.ln_k_fit[index])}</td>
                        <td className="px-3 py-2 font-mono text-xs">{formatScientific(Math.exp(result.curve.ln_k_fit[index]))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
