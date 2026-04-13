type GsaPayload = {
  qA: number;
  qT: number;
  qV: number;
  T0: number;
  F: number;
  NStopMax: number;
};

export type FittingTheory =
  | 'Arrhenius'
  | 'Aquilanti-Mundim'
  | 'NTS'
  | 'VFT'
  | 'ASCC';

export type TheoryConfig = {
  labels: string[];
  initialParams: number[];
  lock: boolean[];
};

export type RemoteFitCurve = {
  temperature: number[];
  inv_temperature: number[];
  k_exp: number[];
  ln_k_exp: number[];
  ln_k_fit: number[];
};

export type RemoteFitResponse = {
  theory: string;
  chi_square: number;
  parameters: Record<string, number>;
  curve: RemoteFitCurve;
};

export type FitResult = {
  modelType: string;
  parameters: Record<string, number>;
  chiSquare: number;
  rSquared: number;
  rmsd: number;
  fittedCurve: {
    temperatures: number[];
    rateConstants: number[];
  };
  residuals: number[];
  success: boolean;
  message: string;
};

export type FittingRunRequest = {
  temperatures: number[];
  rate_constants: number[];
  theory: FittingTheory;
  initial_params: number[];
  lock: boolean[];
  gsa?: Partial<GsaPayload>;
};

export type FittingMultiRequest = {
  temperatures: number[];
  rateConstants: number[];
  modelTypes: string[];
  gsaParams?: Partial<GsaPayload>;
  datasetName?: string;
};

const FITTING_ENDPOINT = 'http://pitomba.ueg.br/fit?use_queue=true';
const TRANSITIVITY_FITTING_ENDPOINT = 'http://pitomba.ueg.br/fit/transitivity?use_queue=true';

export type TransitivityFittingTheory = 'Arrhenius' | 'Aquilanti-Mundim' | 'VFT';

export type TransitivityFitRequest = {
  temperatures: number[];
  rate_constants: number[];
  theory: TransitivityFittingTheory;
  initial_params: number[];
  lock: boolean[];
  gsa?: Partial<GsaPayload>;
  apply_sg?: boolean;
  sg_poly_order?: number;
};

export const TRANSITIVITY_THEORY_CONFIG: Record<TransitivityFittingTheory, TheoryConfig> = {
  Arrhenius: { labels: ['Ea', 'd'], initialParams: [0.1, 0.1], lock: [false, false] },
  'Aquilanti-Mundim': { labels: ['Ea', 'd'], initialParams: [0.1, 0.1], lock: [false, false] },
  VFT: { labels: ['Ea', 'd'], initialParams: [0.1, 0.1], lock: [false, false] },
};

export async function fetchRemoteTransitivityFit(payload: TransitivityFitRequest) {
  const response = await fetch(TRANSITIVITY_FITTING_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      temperatures: payload.temperatures,
      rate_constants: payload.rate_constants,
      theory: payload.theory,
      initial_params: payload.initial_params,
      lock: payload.lock,
      gsa: { ...DEFAULT_GSA, ...payload.gsa },
      apply_sg: payload.apply_sg ?? false,
      sg_poly_order: payload.sg_poly_order ?? 2,
    }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
    throw new Error(body.detail || body.error || `HTTP ${response.status}`);
  }
  return (await response.json()) as RemoteFitResponse;
}

export const THEORY_CONFIG: Record<FittingTheory, TheoryConfig> = {
  Arrhenius: {
    labels: ['A', 'Eo'],
    initialParams: [0.1, 0.1],
    lock: [false, false],
  },
  'Aquilanti-Mundim': {
    labels: ['A', 'Eo', 'd'],
    initialParams: [0.1, 0.1, 0.1],
    lock: [false, false, false],
  },
  NTS: {
    labels: ['A', 'Eo', 'To'],
    initialParams: [0.1, 0.1, 0.1],
    lock: [false, false, false],
  },
  VFT: {
    labels: ['A', 'B', 'To'],
    initialParams: [0.1, 0.1, 0.1],
    lock: [false, false, false],
  },
  ASCC: {
    labels: ['A', 'Eo', 'Ev', 'd'],
    initialParams: [0.1, 0.1, 0.1, 0.1],
    lock: [false, false, false, false],
  },
};

export const MODEL_TO_THEORY: Record<string, FittingTheory> = {
  ARRHENIUS: 'Arrhenius',
  AQUILANTI_MUNDIM: 'Aquilanti-Mundim',
  NTS: 'NTS',
  VFT: 'VFT',
  ASCC: 'ASCC',
};

const DEFAULT_GSA: GsaPayload = {
  qA: 1.1,
  qT: 1.5,
  qV: 1.1,
  T0: 1.0,
  F: 1.0,
  NStopMax: 10000,
};

function computeRSquared(actual: number[], fitted: number[]) {
  if (actual.length === 0 || actual.length !== fitted.length) return 0;

  const mean = actual.reduce((sum, value) => sum + value, 0) / actual.length;
  const ssRes = actual.reduce((sum, value, index) => sum + (value - fitted[index]) ** 2, 0);
  const ssTot = actual.reduce((sum, value) => sum + (value - mean) ** 2, 0);

  if (ssTot === 0) {
    return ssRes === 0 ? 1 : 0;
  }

  return 1 - ssRes / ssTot;
}

function computeRmsd(residuals: number[]) {
  if (residuals.length === 0) return 0;

  const meanSquare = residuals.reduce((sum, value) => sum + value ** 2, 0) / residuals.length;
  return Math.sqrt(meanSquare);
}

function adaptRemoteResult(data: RemoteFitResponse): FitResult {
  const residuals = data.curve.ln_k_exp.map((value, index) => value - data.curve.ln_k_fit[index]);
  const fittedRateConstants = data.curve.ln_k_fit.map((value) => Math.exp(value));

  return {
    modelType: data.theory,
    parameters: data.parameters,
    chiSquare: data.chi_square,
    rSquared: computeRSquared(data.curve.ln_k_exp, data.curve.ln_k_fit),
    rmsd: computeRmsd(residuals),
    fittedCurve: {
      temperatures: data.curve.temperature,
      rateConstants: fittedRateConstants,
    },
    residuals,
    success: true,
    message: 'Fit completed successfully',
  };
}

export async function runRemoteFit(
  modelType: string,
  temperatures: number[],
  rateConstants: number[],
  gsaParams?: Partial<GsaPayload>,
) {
  const theory = MODEL_TO_THEORY[modelType];

  if (!theory) {
    throw new Error(`Model ${modelType} is not supported by the current fitting service`);
  }

  const config = THEORY_CONFIG[theory];

  const data = await fetchRemoteTheoryFit({
    temperatures,
    rate_constants: rateConstants,
    theory,
    initial_params: config.initialParams,
    lock: config.lock,
    gsa: gsaParams,
  });

  return adaptRemoteResult(data);
}

export async function fetchRemoteTheoryFit(payload: FittingRunRequest) {
  const response = await fetch(FITTING_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify({
      temperatures: payload.temperatures,
      rate_constants: payload.rate_constants,
      theory: payload.theory,
      initial_params: payload.initial_params,
      lock: payload.lock,
      gsa: {
        ...DEFAULT_GSA,
        ...payload.gsa,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
    throw new Error(body.detail || body.error || `HTTP ${response.status}`);
  }

  return (await response.json()) as RemoteFitResponse;
}
