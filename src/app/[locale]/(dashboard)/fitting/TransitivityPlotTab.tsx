'use client';

/**
 * GSA Fitting — Transitivity Plot sub-tab.
 * 3 theories, Ea/d params, Savitzky-Golay filter, GSA fieldset, Animation.
 *
 * Reference: docs/audit-tkinter-fitting.md Transitivity Plot
 *            docs/tabs-rebuild-impeccable-plan.md Phase 4
 */

import { useMemo, useState } from 'react';
import type { Data } from 'plotly.js';
import { toast } from 'sonner';
import { FlaskConical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SAMPLE_FITTING_DATA, SAMPLE_FITTING_META } from '@/lib/sample-data';
import { PlotlyChart } from '@/components/chemistry/PlotlyChart';
import { GsaParamsFieldset, DEFAULT_GSA_PARAMS, type GsaParams } from '@/components/chemistry/GsaParamsFieldset';
import { InitialParamsFieldset, type InitialParamValue } from '@/components/chemistry/InitialParamsFieldset';
import { TemperatureRateColumns, type TKPair } from '@/components/chemistry/TemperatureRateColumns';
import { FittingFileButtons } from '@/components/chemistry/FittingFileButtons';
import {
  TRANSITIVITY_THEORIES,
  getTransitivityParams,
  type TransitivityTheory,
} from '@/lib/fitting-theory-config';
import { runTransitivityFitViaProxy, type RemoteFitResponse } from '@/lib/fitting-api';
import { downloadFit } from '@/lib/fitting-save';
import { HoverPreviewPopover } from '@/components/common/HoverPreviewPopover';
import { SGFilterPreview } from '@/components/chemistry/previews/SGFilterPreview';

export function TransitivityPlotTab() {
  const [theory, setTheory] = useState<TransitivityTheory>('Arrhenius');
  const [pairs, setPairs] = useState<TKPair[]>([]);
  const [gsa, setGsa] = useState<GsaParams>(DEFAULT_GSA_PARAMS);
  const [applySg, setApplySg] = useState(false);
  const [sgPolyOrder, setSgPolyOrder] = useState(2);
  const [fitting, setFitting] = useState(false);
  const [result, setResult] = useState<{ tempK: number[]; lnK: number[]; lnFit: number[] } | null>(null);
  const [rawFit, setRawFit] = useState<RemoteFitResponse | null>(null);

  const params = useMemo(() => getTransitivityParams(theory), [theory]);
  const [paramValues, setParamValues] = useState<Record<string, InitialParamValue>>({});

  const loadExample = () => {
    setPairs(SAMPLE_FITTING_DATA.map((p) => ({ T: p.temperature, k: p.rateConstant })));
    toast.success(`${SAMPLE_FITTING_META.title}: ${SAMPLE_FITTING_DATA.length} pontos carregados`);
  };

  const visibleValues = useMemo(() => {
    const next: Record<string, InitialParamValue> = {};
    for (const p of params) next[p.key] = paramValues[p.key] ?? { value: p.default, locked: false };
    return next;
  }, [params, paramValues]);

  const handleFit = async () => {
    if (pairs.length < 2) {
      toast.error('Insira ao menos 2 pontos (T, k)');
      return;
    }
    setFitting(true);
    try {
      const initial = params.map((p) => visibleValues[p.key].value);
      const lock = params.map((p) => visibleValues[p.key].locked);
      const data = await runTransitivityFitViaProxy({
        temperatures: pairs.map((p) => p.T),
        rate_constants: pairs.map((p) => p.k),
        theory,
        initial_params: initial,
        lock,
        gsa,
        apply_sg: applySg,
        sg_poly_order: sgPolyOrder,
      });
      setResult({
        tempK: data.curve.temperature,
        lnK: data.curve.ln_k_exp,
        lnFit: data.curve.ln_k_fit,
      });
      setRawFit(data);
      toast.success(`Fit concluído: χ² = ${data.chi_square.toExponential(3)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fit falhou');
    } finally {
      setFitting(false);
    }
  };

  const chartData: Data[] = result
    ? [
        {
          x: result.tempK,
          y: result.lnK,
          mode: 'markers',
          type: 'scatter',
          name: 'Experimental',
          marker: { size: 7 },
        },
        {
          x: result.tempK,
          y: result.lnFit,
          mode: 'lines',
          type: 'scatter',
          name: 'Fit',
          line: { width: 2 },
        },
      ]
    : [];

  const polyOrderId = 'sg-poly-order';

  return (
    <div className="space-y-4">
    <div className="flex justify-end">
      <Button variant="outline" size="sm" onClick={loadExample}>
        <FlaskConical className="mr-1.5 h-4 w-4" />
        Carregar exemplo
      </Button>
    </div>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              Savitzky-Golay Filter · Filtro Savitzky-Golay
              <HoverPreviewPopover
                preview={SGFilterPreview}
                title="Savitzky-Golay smoothing · Suavização"
                description="Polynomial least-squares filter that smooths noisy k(T) data while preserving peaks. Poly order controls fit degree. / Filtro polinomial que suaviza k(T) mantendo picos."
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={applySg}
                onChange={(e) => setApplySg(e.target.checked)}
                className="accent-primary"
              />
              Apply SG · Aplicar filtro
            </label>
            <div className="flex items-center gap-2">
              <label htmlFor={polyOrderId} className="text-xs text-muted-foreground cursor-pointer">
                Poly order · Ordem do polinômio
              </label>
              <Input
                id={polyOrderId}
                type="number"
                min={1}
                max={5}
                value={sgPolyOrder}
                disabled={!applySg}
                onChange={(e) => setSgPolyOrder(parseInt(e.target.value, 10) || 2)}
                className="h-7 w-16 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Theory · Teoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {TRANSITIVITY_THEORIES.map((t) => (
              <label key={t.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="transitivity-theory"
                  value={t.value}
                  checked={theory === t.value}
                  onChange={() => setTheory(t.value)}
                  className="accent-primary"
                />
                {t.label}
              </label>
            ))}
          </CardContent>
        </Card>

        <InitialParamsFieldset
          params={params}
          values={visibleValues}
          onChange={(k, v) => setParamValues((prev) => ({ ...prev, [k]: v }))}
        />

        <GsaParamsFieldset value={gsa} onChange={setGsa} />
      </div>

      <div className="space-y-4">
        <TemperatureRateColumns value={pairs} onChange={setPairs} />
        <FittingFileButtons
          onOpenFile={setPairs}
          onSave={() => {
            if (!rawFit) return;
            downloadFit(
              {
                theory: rawFit.theory,
                parameters: rawFit.parameters,
                chiSquare: rawFit.chi_square,
                curve: {
                  temperature: rawFit.curve.temperature,
                  lnKExp: rawFit.curve.ln_k_exp,
                  lnKFit: rawFit.curve.ln_k_fit,
                },
                meta: { theorySubtype: 'transitivity' },
              },
              `transitivity_${rawFit.theory.toLowerCase().replace(/\s+/g, '_')}_fit.txt`,
            );
            toast.success('Arquivo salvo');
          }}
          onFit={handleFit}
          fitting={fitting}
          canSave={result !== null}
        />
        {result && (
          <div className="h-80 rounded-lg border border-border bg-card shadow-sm">
            <PlotlyChart
              data={chartData}
              layout={{
                xaxis: { title: { text: 'Temperature (K) · Temperatura (K)' } },
                yaxis: { title: { text: 'ln k · ln da constante' } },
              }}
              ariaLabel="Transitivity fit chart · Curva ajustada de transitividade"
            />
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
