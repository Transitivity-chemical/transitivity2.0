'use client';

import { useCallback, useEffect, useState } from 'react';
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

const FITTING_MODELS = [
  { id: 'ARRHENIUS', label: 'Arrhenius' },
  { id: 'AQUILANTI_MUNDIM', label: 'Aquilanti-Mundim' },
  { id: 'NTS', label: 'NTS (Sub-Arrhenius)' },
  { id: 'VFT', label: 'VFT (Super-Arrhenius)' },
  { id: 'ASCC', label: 'ASCC' },
  { id: 'SATO', label: 'Sato' },
] as const;

interface Dataset {
  id: string;
  name: string;
  points: { temperature: number; rateConstant: number }[];
  source?: string;
}

interface GsaParams {
  maxIter: number;
  qVisiting: number;
  qAcceptance: number;
  qTemperature: number;
}

const DEFAULT_GSA: GsaParams = {
  maxIter: 10000,
  qVisiting: 2.62,
  qAcceptance: -5.0,
  qTemperature: 2.62,
};

export function FittingWizard() {
  const t = useTranslations('fittingWizard');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [selectedModels, setSelectedModels] = useState<string[]>(['ARRHENIUS']);
  const [gsaParams, setGsaParams] = useState<GsaParams>(DEFAULT_GSA);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('/api/v1/experimental-data')
      .then((r) => r.json())
      .then((data) => setDatasets(data.datasets || []))
      .catch(() => setDatasets([]));
  }, []);

  const toggleModel = (id: string) => {
    setSelectedModels((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const canProceed = useCallback((): boolean => {
    if (step === 1) return !!selectedDataset;
    if (step === 2) return selectedModels.length > 0;
    return true;
  }, [step, selectedDataset, selectedModels]);

  const handleSubmit = async () => {
    const dataset = datasets.find((d) => d.id === selectedDataset);
    if (!dataset) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const body = {
        temperatures: dataset.points.map((p) => p.temperature),
        rateConstants: dataset.points.map((p) => p.rateConstant),
        modelTypes: selectedModels,
        gsaParams: showAdvanced
          ? {
              maxiter: gsaParams.maxIter,
              x1: gsaParams.qVisiting,
              x2: gsaParams.qAcceptance,
              x3: gsaParams.qTemperature,
            }
          : undefined,
      };

      const res = await fetch('/api/v1/fitting/run-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || err.detail || `Error ${res.status}`);
      }

      const data = await res.json();

      // Store results in sessionStorage for the results page
      sessionStorage.setItem(
        'fittingResults',
        JSON.stringify({
          ...data,
          datasetName: dataset.name,
          temperatures: body.temperatures,
          rateConstants: body.rateConstants,
        }),
      );

      router.push('../fitting/results');
    } catch (e) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : tCommon('error'));
    }
  };

  const selectedDatasetObj = datasets.find((d) => d.id === selectedDataset);

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => s < step && setStep(s)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                s === step
                  ? 'bg-primary text-primary-foreground'
                  : s < step
                    ? 'bg-primary/20 text-primary cursor-pointer'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {s}
            </button>
            {s < 4 && (
              <div
                className={`h-0.5 w-8 ${
                  s < step ? 'bg-primary/40' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select dataset */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('selectDataset')}</CardTitle>
            <CardDescription>{t('selectDatasetDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {datasets.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noDatasets')}</p>
            ) : (
              <div className="space-y-2">
                {datasets.map((ds) => (
                  <label
                    key={ds.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      selectedDataset === ds.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dataset"
                      value={ds.id}
                      checked={selectedDataset === ds.id}
                      onChange={() => setSelectedDataset(ds.id)}
                      className="accent-primary"
                    />
                    <div>
                      <span className="font-medium">{ds.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({ds.points?.length ?? 0} {t('points')})
                      </span>
                      {ds.source && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          - {ds.source}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select models */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('selectModels')}</CardTitle>
            <CardDescription>{t('selectModelsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {FITTING_MODELS.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    selectedModels.includes(m.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedModels.includes(m.id)}
                    onChange={() => toggleModel(m.id)}
                    className="accent-primary"
                  />
                  <span className="font-medium">{m.label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: GSA parameters */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('gsaParameters')}</CardTitle>
            <CardDescription>{t('gsaParametersDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showAdvanced}
                  onChange={(e) => setShowAdvanced(e.target.checked)}
                  className="accent-primary"
                />
                {t('showAdvanced')}
              </label>
            </div>

            {showAdvanced && (
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ['maxIter', t('maxIterations'), gsaParams.maxIter],
                    ['qVisiting', 'q (Visiting)', gsaParams.qVisiting],
                    ['qAcceptance', 'q (Acceptance)', gsaParams.qAcceptance],
                    ['qTemperature', 'q (Temperature)', gsaParams.qTemperature],
                  ] as const
                ).map(([key, label, value]) => (
                  <div key={key}>
                    <label className="mb-1 block text-sm font-medium">
                      {label}
                    </label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) =>
                        setGsaParams((p) => ({
                          ...p,
                          [key]: parseFloat(e.target.value) || 0,
                        }))
                      }
                      step={key === 'maxIter' ? 1000 : 0.01}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                ))}
              </div>
            )}

            {!showAdvanced && (
              <p className="text-sm text-muted-foreground">
                {t('defaultParams')}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Run */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reviewRun')}</CardTitle>
            <CardDescription>{t('reviewRunDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="font-medium">{t('dataset')}:</span>{' '}
              {selectedDatasetObj?.name ?? '-'}
              {selectedDatasetObj && (
                <span className="text-muted-foreground">
                  {' '}
                  ({selectedDatasetObj.points?.length ?? 0} {t('points')})
                </span>
              )}
            </div>
            <div>
              <span className="font-medium">{t('models')}:</span>{' '}
              {selectedModels
                .map((id) => FITTING_MODELS.find((m) => m.id === id)?.label ?? id)
                .join(', ')}
            </div>
            <div>
              <span className="font-medium">{t('gsaParameters')}:</span>{' '}
              {showAdvanced
                ? `maxIter=${gsaParams.maxIter}, qV=${gsaParams.qVisiting}, qA=${gsaParams.qAcceptance}, qT=${gsaParams.qTemperature}`
                : t('defaultParams')}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center gap-3">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            {tCommon('back')}
          </Button>
        )}

        {step < 4 && (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            {tCommon('next')}
          </Button>
        )}

        {step === 4 && (
          <Button onClick={handleSubmit} disabled={status === 'loading'}>
            {status === 'loading' ? tCommon('loading') : t('runFitting')}
          </Button>
        )}

        {errorMsg && (
          <p className="text-sm text-destructive">{errorMsg}</p>
        )}
      </div>
    </div>
  );
}
