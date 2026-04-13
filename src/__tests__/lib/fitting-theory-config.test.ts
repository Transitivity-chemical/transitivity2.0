import { describe, it, expect } from 'vitest';
import {
  ARRHENIUS_THEORIES,
  TRANSITIVITY_THEORIES,
  getArrheniusParams,
  getTransitivityParams,
} from '@/lib/fitting-theory-config';

describe('fitting-theory-config', () => {
  it('has 5 Arrhenius theories', () => {
    expect(ARRHENIUS_THEORIES).toHaveLength(5);
    expect(ARRHENIUS_THEORIES.map((t) => t.value)).toEqual([
      'Arrhenius',
      'Aquilanti-Mundim',
      'NTS',
      'VFT',
      'ASCC',
    ]);
  });

  it('has 3 Transitivity theories', () => {
    expect(TRANSITIVITY_THEORIES).toHaveLength(3);
  });

  it('Arrhenius 2-param, NTS 4-param', () => {
    expect(getArrheniusParams('Arrhenius')).toHaveLength(2);
    expect(getArrheniusParams('NTS')).toHaveLength(4);
  });

  it('Transitivity Arrhenius has Ea only', () => {
    expect(getTransitivityParams('Arrhenius')).toEqual([
      { key: 'Ea', label: 'Ea', default: 0.1 },
    ]);
  });

  it('returns empty for unknown theory', () => {
    // @ts-expect-error deliberately invalid
    expect(getArrheniusParams('Unknown')).toEqual([]);
  });
});
