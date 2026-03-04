import { describe, it, expect } from 'vitest';
import { experimentalDataSchema, experimentalPointSchema } from '@/lib/validators/experimental-data';

describe('experimentalPointSchema', () => {
  it('accepts valid point', () => {
    const result = experimentalPointSchema.safeParse({ temperature: 300, rateConstant: 1.5e-3 });
    expect(result.success).toBe(true);
  });

  it('rejects non-positive temperature', () => {
    const result = experimentalPointSchema.safeParse({ temperature: -10, rateConstant: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive rate constant', () => {
    const result = experimentalPointSchema.safeParse({ temperature: 300, rateConstant: 0 });
    expect(result.success).toBe(false);
  });
});

describe('experimentalDataSchema', () => {
  const validPoints = [
    { temperature: 300, rateConstant: 1e-3 },
    { temperature: 400, rateConstant: 2e-3 },
    { temperature: 500, rateConstant: 3e-3 },
  ];

  it('accepts valid experimental data', () => {
    const result = experimentalDataSchema.safeParse({
      name: 'Test Dataset',
      points: validPoints,
    });
    expect(result.success).toBe(true);
  });

  it('rejects fewer than 3 data points', () => {
    const result = experimentalDataSchema.safeParse({
      name: 'Test',
      points: validPoints.slice(0, 2),
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = experimentalDataSchema.safeParse({
      name: '',
      points: validPoints,
    });
    expect(result.success).toBe(false);
  });

  it('allows optional fields (source, citation, doi)', () => {
    const result = experimentalDataSchema.safeParse({
      name: 'Test Dataset',
      source: 'Journal of Chemistry',
      citation: 'Smith et al. 2024',
      doi: '10.1234/test',
      points: validPoints,
    });
    expect(result.success).toBe(true);
  });
});
