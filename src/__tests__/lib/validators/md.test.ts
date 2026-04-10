import { describe, it, expect } from 'vitest';
import { mdGenerateSchema, mdAtomSchema } from '@/lib/validators/md';

describe('mdAtomSchema', () => {
  it('accepts a valid atom', () => {
    const result = mdAtomSchema.safeParse({ element: 'C', x: 0, y: 0, z: 0 });
    expect(result.success).toBe(true);
  });

  it('rejects empty element', () => {
    const result = mdAtomSchema.safeParse({ element: '', x: 0, y: 0, z: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects element longer than 3 chars', () => {
    const result = mdAtomSchema.safeParse({ element: 'Carbon', x: 0, y: 0, z: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric coordinates', () => {
    const result = mdAtomSchema.safeParse({ element: 'H', x: 'a', y: 0, z: 0 });
    expect(result.success).toBe(false);
  });
});

describe('mdGenerateSchema', () => {
  const validInput = {
    atoms: [{ element: 'H', x: 0, y: 0, z: 0 }],
  };

  it('accepts minimal valid input with defaults', () => {
    const result = mdGenerateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dynamicsType).toBe('CPMD');
      expect(result.data.functional).toBe('PBE');
      expect(result.data.temperature).toBe(300);
      expect(result.data.maxSteps).toBe(50000);
    }
  });

  it('rejects empty atoms array', () => {
    const result = mdGenerateSchema.safeParse({ atoms: [] });
    expect(result.success).toBe(false);
  });

  it('accepts all valid dynamics types', () => {
    for (const dt of ['CPMD', 'BOMD', 'PIMD', 'SHMD', 'MTD']) {
      const result = mdGenerateSchema.safeParse({ ...validInput, dynamicsType: dt });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid dynamics type', () => {
    const result = mdGenerateSchema.safeParse({ ...validInput, dynamicsType: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('rejects negative temperature', () => {
    const result = mdGenerateSchema.safeParse({ ...validInput, temperature: -100 });
    expect(result.success).toBe(false);
  });

  it('rejects extra fields in strict mode', () => {
    const result = mdGenerateSchema.safeParse({ ...validInput, unknownField: true });
    expect(result.success).toBe(false);
  });
});
