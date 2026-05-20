import { describe, it, expect, beforeEach } from 'vitest';
import { RouterEngine } from '../src/router/engine.js';
import type { ModelAlias } from '../src/types/index.js';

describe('RouterEngine', () => {
  let engine: RouterEngine;

  beforeEach(() => {
    engine = new RouterEngine();
  });

  it('resolves known alias to provider + modelId', () => {
    const result = engine.resolve('smart');
    expect(result.provider).toBe('router9');
    expect(result.modelId).toBe('Racikan');
  });

  it('resolves Racikan alias directly', () => {
    const result = engine.resolve('Racikan');
    expect(result.provider).toBe('router9');
    expect(result.modelId).toBe('Racikan');
  });

  it('falls back to router9 for unknown raw model ID', () => {
    const result = engine.resolve('gpt-4o-mini');
    expect(result.provider).toBe('router9');
    expect(result.modelId).toBe('gpt-4o-mini');
  });

  it('is case-insensitive', () => {
    expect(engine.resolve('SMART').modelId).toBe('Racikan');
    expect(engine.resolve('Fast').modelId).toBe('Racikan');
  });

  it('lists all aliases', () => {
    const aliases = engine.listAliases();
    expect(aliases.length).toBeGreaterThan(0);
    expect(aliases.map((a) => a.alias)).toContain('Racikan');
  });

  it('upsertAlias overrides existing alias', () => {
    const custom: ModelAlias = {
      alias: 'coding',
      provider: 'openai',
      modelId: 'gpt-4o',
      description: 'Custom coding alias',
      capabilities: ['coding'],
    };
    engine.upsertAlias(custom);
    const result = engine.resolve('coding');
    expect(result.provider).toBe('openai');
    expect(result.modelId).toBe('gpt-4o');
  });

  it('resolves with fallback chain', () => {
    const result = engine.resolve('smart');
    expect(result.fallback ?? 'none').toBe('none'); // default no fallback
  });
});