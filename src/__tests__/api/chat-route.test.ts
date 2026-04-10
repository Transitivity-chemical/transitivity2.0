import { describe, it, expect } from 'vitest';
import { AI_MODEL_CONFIGS, getModelById } from '@/lib/ai-models';

describe('MODELS configuration', () => {
  it('has models configured', () => {
    expect(AI_MODEL_CONFIGS.length).toBeGreaterThan(10);
  });

  it('all models have non-empty id, name, and provider', () => {
    for (const model of AI_MODEL_CONFIGS) {
      expect(model.id).toBeTruthy();
      expect(model.name).toBeTruthy();
      expect(model.provider).toBeTruthy();
    }
  });

  it('all model IDs follow provider/model format', () => {
    for (const model of AI_MODEL_CONFIGS) {
      expect(model.id).toMatch(/^[\w-]+\/[\w.:-]+$/);
    }
  });

  it('has at least one free and one paid model', () => {
    const freeModels = AI_MODEL_CONFIGS.filter((m) => m.isFree);
    const paidModels = AI_MODEL_CONFIGS.filter((m) => !m.isFree);

    expect(freeModels.length).toBeGreaterThan(0);
    expect(paidModels.length).toBeGreaterThan(0);
  });

  it('free models have zero cost', () => {
    const freeModels = AI_MODEL_CONFIGS.filter((m) => m.isFree);
    for (const model of freeModels) {
      expect(model.inputCostPer1M).toBe(0);
      expect(model.outputCostPer1M).toBe(0);
    }
  });

  it('pro models have positive costs', () => {
    const proModels = AI_MODEL_CONFIGS.filter((m) => !m.isFree);
    for (const model of proModels) {
      expect((model.inputCostPer1M ?? 0)).toBeGreaterThan(0);
      expect((model.outputCostPer1M ?? 0)).toBeGreaterThan(0);
    }
  });

  it('all model IDs are unique', () => {
    const ids = AI_MODEL_CONFIGS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('contains expected providers', () => {
    const providers = [...new Set(AI_MODEL_CONFIGS.map((m) => m.provider))];
    expect(providers).toContain('DeepSeek');
    expect(providers).toContain('Meta');
    expect(providers).toContain('OpenAI');
    expect(providers).toContain('Anthropic');
    expect(providers).toContain('Google');
  });

  it('can retrieve a known model by id', () => {
    const claude = getModelById('anthropic/claude-sonnet-4');
    expect(claude).toBeDefined();
    expect(claude?.provider).toBe('Anthropic');
    expect(claude?.isFree).not.toBe(true);
  });
});
