import { Prisma, type FittingModelType, type FittingPlotType } from '@prisma/client';
import type { FitResult, FittingTheory, RemoteFitResponse } from './fitting-api';

type GsaLike = {
  qA?: number;
  qT?: number;
  qV?: number;
  T0?: number;
  F?: number;
  NStopMax?: number;
};

const DEFAULT_GSA = {
  qA: 1.1,
  qT: 1.5,
  qV: 1.1,
  T0: 1.0,
  F: 1.0,
  NStopMax: 10000,
} as const;

function findParam(parameters: Record<string, number>, ...aliases: string[]) {
  const normalizedAliases = aliases.map((alias) => alias.toLowerCase());

  for (const [key, value] of Object.entries(parameters)) {
    if (normalizedAliases.includes(key.toLowerCase())) {
      return value;
    }
  }

  return null;
}

export function theoryToModelType(theory: FittingTheory): FittingModelType {
  const map: Record<FittingTheory, FittingModelType> = {
    Arrhenius: 'ARRHENIUS',
    'Aquilanti-Mundim': 'AQUILANTI_MUNDIM',
    NTS: 'NTS',
    VFT: 'VFT',
    ASCC: 'ASCC',
  };

  return map[theory];
}

export function defaultPlotTypeForModel(): FittingPlotType {
  return 'ARRHENIUS';
}

export function buildGsaFields(gsa?: GsaLike) {
  return {
    gsaQAcceptance: gsa?.qA ?? DEFAULT_GSA.qA,
    gsaQTemperature: gsa?.qT ?? DEFAULT_GSA.qT,
    gsaQVisiting: gsa?.qV ?? DEFAULT_GSA.qV,
    gsaInitialTemp: gsa?.T0 ?? DEFAULT_GSA.T0,
    gsaStepScale: gsa?.F ?? DEFAULT_GSA.F,
    gsaMaxIter: gsa?.NStopMax ?? DEFAULT_GSA.NStopMax,
  };
}

export function buildFittingResultFromRemote(
  result: RemoteFitResponse,
): Prisma.FittingResultCreateWithoutFittingJobInput {
  return {
    chiSquare: result.chi_square,
    paramA: findParam(result.parameters, 'A'),
    paramEo: findParam(result.parameters, 'Eo', 'EO'),
    paramD: findParam(result.parameters, 'd', 'D'),
    paramTo: findParam(result.parameters, 'To', 'T0', 'TO'),
    paramB: findParam(result.parameters, 'B'),
    paramEv: findParam(result.parameters, 'Ev', 'EV'),
    fittedCurve: result.curve as Prisma.InputJsonValue,
    rawParams: result.parameters as Prisma.InputJsonValue,
  };
}

export function buildFittingResultFromFitResult(
  result: FitResult,
): Prisma.FittingResultCreateWithoutFittingJobInput {
  return {
    chiSquare: result.chiSquare,
    paramA: findParam(result.parameters, 'A'),
    paramEo: findParam(result.parameters, 'Eo', 'EO'),
    paramD: findParam(result.parameters, 'd', 'D'),
    paramTo: findParam(result.parameters, 'To', 'T0', 'TO'),
    paramB: findParam(result.parameters, 'B'),
    paramEv: findParam(result.parameters, 'Ev', 'EV'),
    fittedCurve: result.fittedCurve as Prisma.InputJsonValue,
    rawParams: {
      parameters: result.parameters,
      rSquared: result.rSquared,
      rmsd: result.rmsd,
      residuals: result.residuals,
      success: result.success,
      message: result.message,
    } as Prisma.InputJsonValue,
  };
}
