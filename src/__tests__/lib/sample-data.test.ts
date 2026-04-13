import { describe, it, expect } from 'vitest';
import {
  SAMPLE_FITTING_DATA,
  SAMPLE_FITTING_META,
  SAMPLE_BENZOIC_ACID_ATOMS,
} from '@/lib/sample-data';

describe('sample-data', () => {
  it('OH+HBr dataset has 13 ultra-low-T points', () => {
    expect(SAMPLE_FITTING_DATA.length).toBe(13);
    expect(SAMPLE_FITTING_DATA[0].temperature).toBe(23);
    expect(SAMPLE_FITTING_DATA[SAMPLE_FITTING_DATA.length - 1].temperature).toBe(295);
  });

  it('all rate constants are positive', () => {
    for (const { rateConstant } of SAMPLE_FITTING_DATA) {
      expect(rateConstant).toBeGreaterThan(0);
    }
  });

  it('meta cites the original paper', () => {
    expect(SAMPLE_FITTING_META.title).toMatch(/OH/);
    expect(SAMPLE_FITTING_META.citation).toMatch(/1994/);
  });

  it('benzoic acid sample has atoms', () => {
    expect(SAMPLE_BENZOIC_ACID_ATOMS.length).toBeGreaterThan(5);
    for (const a of SAMPLE_BENZOIC_ACID_ATOMS) {
      expect(typeof a.element).toBe('string');
    }
  });
});
