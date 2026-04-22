'use client';

/**
 * Marcus Theory sub-tab. Reactants 1-2, Transition State, Products 1-2,
 * Vertical Products 1-2 (Franck-Condon geometry), Temperature range.
 *
 * Backend: POST /api/v1/rate-constant/marcus (Phase 6 — new endpoint).
 *
 * Reference: docs/audit-tkinter-rate.md Marcus Theory
 *            docs/tabs-rebuild-impeccable-plan.md Phases 5, 6
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Sparkles, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpeciesPanel, type ParsedSpecies } from '@/components/chemistry/SpeciesPanel';
import { TemperatureConfig, DEFAULT_TEMPERATURES } from '@/components/chemistry/TemperatureConfig';
import { HoverPreviewPopover } from '@/components/common/HoverPreviewPopover';
import { MarcusLambdaPreview } from '@/components/chemistry/previews/MarcusLambdaPreview';
import { computeMarcus } from '@/lib/marcus-compute';
import { usePersistentState } from '@/lib/use-persistent-state';

type MarcusResult = {
  temperatures: number[];
  rate_constants: number[];
  lambda_reorganization: number;
  dg_activation: number;
  dg_reaction?: number;
};

const EMPTY: ParsedSpecies | null = null;

export function MarcusTheoryTab() {
  // Persisted across reloads — see lib/use-persistent-state.ts
  const [reactant1, setReactant1] = usePersistentState<ParsedSpecies | null>('ratecs:marcus:r1', EMPTY);
  const [reactant2, setReactant2] = usePersistentState<ParsedSpecies | null>('ratecs:marcus:r2', EMPTY);
  const [transitionState, setTransitionState] = usePersistentState<ParsedSpecies | null>('ratecs:marcus:ts', EMPTY);
  const [product1, setProduct1] = usePersistentState<ParsedSpecies | null>('ratecs:marcus:p1', EMPTY);
  const [product2, setProduct2] = usePersistentState<ParsedSpecies | null>('ratecs:marcus:p2', EMPTY);
  const [verticalProduct1, setVerticalProduct1] = usePersistentState<ParsedSpecies | null>('ratecs:marcus:v1', EMPTY);
  const [verticalProduct2, setVerticalProduct2] = usePersistentState<ParsedSpecies | null>('ratecs:marcus:v2', EMPTY);
  const [temperatures, setTemperatures] = usePersistentState<number[]>('ratecs:marcus:temps', [...DEFAULT_TEMPERATURES]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MarcusResult | null>(null);

  const handleCompute = async () => {
    if (!reactant1?.filename || !product1?.filename || !verticalProduct1?.filename) {
      toast.error('Reactant 1, Product 1 and Vertical Product 1 são obrigatórios');
      return;
    }
    setLoading(true);

    // Try backend first; fall back to client-side compute on 404 / network error.
    const payload = {
      reactant_1: reactant1,
      reactant_2: reactant2?.filename ? reactant2 : null,
      transition_state: transitionState?.filename ? transitionState : null,
      product_1: product1,
      product_2: product2?.filename ? product2 : null,
      vertical_product_1: verticalProduct1,
      vertical_product_2: verticalProduct2?.filename ? verticalProduct2 : null,
      temperatures,
    };

    try {
      const res = await fetch('/api/v1/rate-constant/marcus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = (await res.json()) as MarcusResult;
        setResult(data);
        toast.success('Taxa de Marcus calculada');
        setLoading(false);
        return;
      }
      // any non-ok response (404 / 500 / 502 / proxy error) → client fallback
    } catch {
      // network error → client fallback
    }

    // Client-side fallback (math runs in-browser; works offline and before deploy).
    try {
      const local = computeMarcus({
        reactants: [reactant1, reactant2].filter(Boolean) as ParsedSpecies[],
        products: [product1, product2].filter(Boolean) as ParsedSpecies[],
        verticalProducts: [verticalProduct1, verticalProduct2].filter(Boolean) as ParsedSpecies[],
        temperatures,
      });
      setResult(local);
      toast.success('Taxa de Marcus calculada (local)');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(false);
    }
  };

  const loadExample = () => {
    // Ferrocene/ferrocenium self-exchange at 298 K.
    // λ ≈ 0.84 eV, ΔG° = 0, ΔG‡ ≈ 0.21 eV (reference benchmark).
    const zero: ParsedSpecies = { filename: 'Fc.log', scfEnergy: 0 };
    const vert: ParsedSpecies = { filename: 'Fc+_vertical.log', scfEnergy: 0.84 / 27.2114 };
    setReactant1(zero);
    setProduct1({ ...zero, filename: 'Fc+.log' });
    setVerticalProduct1(vert);
    setTransitionState({ ...zero, filename: 'Fc_TS.log' });
    toast.success('Ferroceno/Ferrocênio (Fc/Fc⁺) carregado — λ ≈ 0.84 eV');
  };

  return (
    <div className="space-y-4">
    <div className="flex justify-end">
      <Button variant="outline" size="sm" onClick={loadExample}>
        <FlaskConical className="mr-1.5 h-4 w-4" />
        Carregar exemplo
      </Button>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <SpeciesPanel label="Reactant 1" value={reactant1} onChange={setReactant1} required allowEnergyOverride={false} />
        <SpeciesPanel label="Reactant 2 (optional)" value={reactant2} onChange={setReactant2} allowEnergyOverride={false} />
        <SpeciesPanel label="Transition State (optional)" value={transitionState} onChange={setTransitionState} allowEnergyOverride={false} />
        <SpeciesPanel label="Product 1" value={product1} onChange={setProduct1} required allowEnergyOverride={false} />
        <SpeciesPanel label="Product 2 (optional)" value={product2} onChange={setProduct2} allowEnergyOverride={false} />
      </div>

      <div className="space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              Vertical Products (Franck-Condon geometry) · Produtos verticais (geometria de Franck-Condon)
              <HoverPreviewPopover
                preview={MarcusLambdaPreview}
                title="Reorganization energy λ · Energia de reorganização"
                description="λ = E(vertical products) − E(relaxed products). Vertical products are computed at the reactant Franck-Condon geometry. / Diferença entre produtos verticais e relaxados."
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SpeciesPanel label="Vertical Product 1" value={verticalProduct1} onChange={setVerticalProduct1} required allowEnergyOverride={false} />
            <SpeciesPanel label="Vertical Product 2 (optional)" value={verticalProduct2} onChange={setVerticalProduct2} allowEnergyOverride={false} />
          </CardContent>
        </Card>

        <TemperatureConfig value={temperatures} onChange={setTemperatures} />

        <Button onClick={handleCompute} disabled={loading} className="w-full">
          {loading ? (
            <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Computing… · Calculando…</>
          ) : (
            <><Sparkles className="mr-1.5 h-4 w-4" /> Compute Marcus Rate · Calcular taxa de Marcus</>
          )}
        </Button>

        {result && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Result · Resultado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs font-mono">
              <div>λ (reorganization) = {result.lambda_reorganization.toFixed(4)} eV · reorganização</div>
              <div>ΔG‡ (activation) = {result.dg_activation.toFixed(4)} eV · ativação</div>
              <div>{result.rate_constants.length} rate points computed · pontos de taxa</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </div>
  );
}
