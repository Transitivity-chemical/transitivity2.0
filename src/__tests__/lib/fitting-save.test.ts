import { describe, it, expect } from 'vitest';
import { formatFitAsText } from '@/lib/fitting-save';

describe('formatFitAsText', () => {
  const payload = {
    theory: 'Arrhenius',
    parameters: { A: 1.2e13, Eo: 25.4 },
    chiSquare: 3.14e-4,
    curve: {
      temperature: [200, 300, 400],
      lnKExp: [-24.1, -22.0, -20.5],
      lnKFit: [-24.0, -22.1, -20.4],
    },
    meta: { datasetName: 'OH+HBr', theorySubtype: 'arrhenius' as const },
  };

  it('includes theory, chi square, and parameters in the header', () => {
    const out = formatFitAsText(payload);
    expect(out).toContain('Theory  : Arrhenius');
    expect(out).toContain('Dataset : OH+HBr');
    expect(out).toContain('Subtype : arrhenius');
    expect(out).toContain('ChiSq');
    expect(out).toContain('A');
    expect(out).toContain('Eo');
  });

  it('emits one data row per temperature', () => {
    const out = formatFitAsText(payload);
    const dataRows = out.split('\n').filter((line) => /^\s*\d/.test(line));
    expect(dataRows).toHaveLength(3);
  });

  it('handles missing lnKExp as dash', () => {
    const out = formatFitAsText({
      ...payload,
      curve: { temperature: [100], lnKFit: [-30] },
    });
    const row = out.split('\n').find((l) => l.startsWith('   100.000'));
    expect(row).toContain('-');
  });
});
