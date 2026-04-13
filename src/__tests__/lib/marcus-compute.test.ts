import { describe, it, expect } from 'vitest';
import { computeMarcus, HARTREE_TO_EV } from '@/lib/marcus-compute';

const ev = (e: number) => e / HARTREE_TO_EV; // eV → Hartree

describe('computeMarcus (client)', () => {
  it('ferrocene self-exchange benchmark', () => {
    const out = computeMarcus({
      reactants: [{ scfEnergy: 0 }],
      products: [{ scfEnergy: 0 }],
      verticalProducts: [{ scfEnergy: ev(0.84) }],
      temperatures: [298.15],
    });
    expect(out.lambda_reorganization).toBeCloseTo(0.84, 3);
    expect(out.dg_reaction).toBeCloseTo(0, 6);
    expect(out.dg_activation).toBeCloseTo(0.21, 3);
    expect(out.rate_constants[0]).toBeGreaterThan(1e9);
    expect(out.rate_constants[0]).toBeLessThan(1e11);
  });

  it('rejects non-positive lambda', () => {
    expect(() =>
      computeMarcus({
        reactants: [{ scfEnergy: 0 }],
        products: [{ scfEnergy: 0 }],
        verticalProducts: [{ scfEnergy: 0 }],
        temperatures: [298],
      }),
    ).toThrow(/Reorganization energy must be positive/);
  });

  it('rejects missing reactant energies', () => {
    expect(() =>
      computeMarcus({
        reactants: [{ scfEnergy: null }],
        products: [{ scfEnergy: 0 }],
        verticalProducts: [{ scfEnergy: ev(0.5) }],
        temperatures: [298],
      }),
    ).toThrow(/reactant/i);
  });

  it('defaults temperature to 298.15 K', () => {
    const out = computeMarcus({
      reactants: [{ scfEnergy: 0 }],
      products: [{ scfEnergy: 0 }],
      verticalProducts: [{ scfEnergy: ev(0.5) }],
      temperatures: [],
    });
    expect(out.temperatures).toEqual([298.15]);
  });
});
