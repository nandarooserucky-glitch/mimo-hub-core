import type { ModelAlias, RoutingDecision } from '../types/index.js';

// Default alias -> (provider, modelId) mapping.
// In the MVP, aliases resolve through the primary router's aggregate model.
// The router itself handles internal routing to upstream models.
// Individual provider model IDs are used for direct-provider fallback.
const DEFAULT_ALIASES: ModelAlias[] = [
  {
    alias: 'Racikan',
    provider: 'router9',
    modelId: 'Racikan',
    description: 'Aggregate model via 9Router (auto-optimized routing)',
    capabilities: ['chat', 'reasoning', 'coding'],
  },
  {
    alias: 'smart',
    provider: 'router9',
    modelId: 'Racikan',
    description: 'Best quality for complex tasks',
    capabilities: ['chat', 'reasoning', 'coding'],
  },
  {
    alias: 'fast',
    provider: 'router9',
    modelId: 'Racikan',
    description: 'Fast response for simple queries',
    capabilities: ['chat'],
  },
  {
    alias: 'coding',
    provider: 'router9',
    modelId: 'Racikan',
    description: 'Optimized for code generation and review',
    capabilities: ['coding', 'chat'],
  },
  {
    alias: 'cheap',
    provider: 'router9',
    modelId: 'Racikan',
    description: 'Budget-friendly for high-volume tasks',
    capabilities: ['chat'],
  },
];

export class RouterEngine {
  private readonly aliases: Map<string, ModelAlias>;
  private readonly fallbackMap: Map<string, string>;

  constructor(customAliases?: ModelAlias[]) {
    this.aliases = new Map();
    this.fallbackMap = new Map();

    // Load defaults then apply overrides
    for (const alias of DEFAULT_ALIASES) {
      this.aliases.set(alias.alias.toLowerCase(), alias);
    }
    if (customAliases) {
      for (const alias of customAliases) {
        this.aliases.set(alias.alias.toLowerCase(), alias);
        // chain fallback
        if (alias.fallback) {
          this.fallbackMap.set(alias.alias.toLowerCase(), alias.fallback);
        }
      }
    }
  }

  /** Resolve a model identifier (alias or raw model ID) to a routing decision. */
  resolve(model: string): RoutingDecision {
    const key = model.toLowerCase();

    // Alias lookup
    const alias = this.aliases.get(key);
    if (alias) {
      return {
        provider: alias.provider,
        modelId: alias.modelId,
        fallback: this.fallbackMap.get(key),
      };
    }

    // Raw model ID — route to primary (router9) by default
    // Caller should handle unknown model gracefully.
    return {
      provider: 'router9',
      modelId: model,
      fallback: 'openai',
    };
  }

  /** List all known aliases with metadata. */
  listAliases(): ModelAlias[] {
    return Array.from(this.aliases.values());
  }

  /** Register or update an alias at runtime. */
  upsertAlias(alias: ModelAlias): void {
    this.aliases.set(alias.alias.toLowerCase(), alias);
    if (alias.fallback) {
      this.fallbackMap.set(alias.alias.toLowerCase(), alias.fallback);
    }
  }
}