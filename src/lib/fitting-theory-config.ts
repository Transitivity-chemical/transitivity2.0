/**
 * Theory → params mapping for GSA Fitting tabs.
 *
 * Reference: docs/audit-tkinter-fitting.md
 *            docs/tabs-rebuild-impeccable-plan.md Phase 4.5
 */

export type ArrheniusTheory = 'Arrhenius' | 'Aquilanti-Mundim' | 'NTS' | 'VFT' | 'ASCC';
export type TransitivityTheory = 'Arrhenius' | 'Aquilanti-Mundim' | 'VFT';

export interface ParamSpec {
  key: string;
  label: string;
  default: number;
}

export const ARRHENIUS_THEORIES: { value: ArrheniusTheory; label: string; params: ParamSpec[] }[] = [
  {
    value: 'Arrhenius',
    label: 'Arrhenius',
    params: [
      { key: 'A', label: 'A', default: 0.1 },
      { key: 'Eo', label: 'Eo', default: 0.1 },
    ],
  },
  {
    value: 'Aquilanti-Mundim',
    label: 'Aquilanti-Mundim',
    params: [
      { key: 'A', label: 'A', default: 0.1 },
      { key: 'Eo', label: 'Eo', default: 0.1 },
      { key: 'd', label: 'd', default: 0.1 },
    ],
  },
  {
    value: 'NTS',
    label: 'NTS',
    params: [
      { key: 'A', label: 'A', default: 0.1 },
      { key: 'Eo', label: 'Eo', default: 0.1 },
      { key: 'd', label: 'd', default: 0.1 },
      { key: 'To', label: 'To', default: 0.1 },
    ],
  },
  {
    value: 'VFT',
    label: 'VFT',
    params: [
      { key: 'A', label: 'A', default: 0.1 },
      { key: 'Eo', label: 'Eo', default: 0.1 },
      { key: 'To', label: 'To', default: 0.1 },
    ],
  },
  {
    value: 'ASCC',
    label: 'ASCC',
    params: [
      { key: 'A', label: 'A', default: 0.1 },
      { key: 'Eo', label: 'Eo', default: 0.1 },
      { key: 'B', label: 'B', default: 0.1 },
    ],
  },
];

export const TRANSITIVITY_THEORIES: { value: TransitivityTheory; label: string; params: ParamSpec[] }[] = [
  {
    value: 'Arrhenius',
    label: 'Arrhenius',
    params: [
      { key: 'Ea', label: 'Ea', default: 0.1 },
    ],
  },
  {
    value: 'Aquilanti-Mundim',
    label: 'Aquilanti-Mundim',
    params: [
      { key: 'Ea', label: 'Ea', default: 0.1 },
      { key: 'd', label: 'd', default: 0.1 },
    ],
  },
  {
    value: 'VFT',
    label: 'VFT',
    params: [
      { key: 'Ea', label: 'Ea', default: 0.1 },
      { key: 'To', label: 'To', default: 0.1 },
    ],
  },
];

export function getArrheniusParams(theory: ArrheniusTheory): ParamSpec[] {
  return ARRHENIUS_THEORIES.find((t) => t.value === theory)?.params ?? [];
}

export function getTransitivityParams(theory: TransitivityTheory): ParamSpec[] {
  return TRANSITIVITY_THEORIES.find((t) => t.value === theory)?.params ?? [];
}
