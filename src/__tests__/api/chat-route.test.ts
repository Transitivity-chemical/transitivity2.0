import { describe, it, expect } from 'vitest';
import { MODELS } from '@/app/api/v1/chat/route';
import type { ModelConfig } from '@/app/api/v1/chat/route';

describe('MODELS configuration', () => {
  it('has 10 models total', () => {
    expect(MODELS).toHaveLength(10);
  });

  it('all models have non-empty id, name, and provider', () => {
    for (const model of MODELS) {
      expect(model.id).toBeTruthy();
      expect(model.name).toBeTruthy();
      expect(model.provider).toBeTruthy();
    }
  });

  it('all model IDs follow provider/model format', () => {
    for (const model of MODELS) {
      expect(model.id).toMatch(/^[\w-]+\/[\w.-]+$/);
    }
  });

  it('has 6 free models', () => {
    const freeModels = MODELS.filter(m => m.isFree);
    expect(freeModels).toHaveLength(6);
  });

  it('has 4 pro models', () => {
    const proModels = MODELS.filter(m => !m.isFree);
    expect(proModels).toHaveLength(4);
  });

  it('free models have zero cost', () => {
    const freeModels = MODELS.filter(m => m.isFree);
    for (const model of freeModels) {
      expect(model.inputCostPer1M).toBe(0);
      expect(model.outputCostPer1M).toBe(0);
    }
  });

  it('pro models have positive costs', () => {
    const proModels = MODELS.filter(m => !m.isFree);
    for (const model of proModels) {
      expect(model.inputCostPer1M).toBeGreaterThan(0);
      expect(model.outputCostPer1M).toBeGreaterThan(0);
    }
  });

  it('all model IDs are unique', () => {
    const ids = MODELS.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('contains expected providers', () => {
    const providers = [...new Set(MODELS.map(m => m.provider))];
    expect(providers).toContain('DeepSeek');
    expect(providers).toContain('Meta');
    expect(providers).toContain('OpenAI');
    expect(providers).toContain('Anthropic');
    expect(providers).toContain('Google');
  });

  it('includes Claude Sonnet 4 as a pro model', () => {
    const claude = MODELS.find(m => m.name === 'Claude Sonnet 4');
    expect(claude).toBeDefined();
    expect(claude!.isFree).toBe(false);
    expect(claude!.provider).toBe('Anthropic');
  });
});
