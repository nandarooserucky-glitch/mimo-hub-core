// ============================================================
// Core shared types
// ============================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string; // alias or raw provider model ID
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  // passthrough fields
  presence_penalty?: number;
  frequency_penalty?: number;
  stop?: string | string[];
}

export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: { role?: string; content?: string };
    finish_reason?: string;
  }>;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Provider definition
export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  defaultModel?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

// Model alias mapping
export interface ModelAlias {
  alias: string;
  provider: string; // provider name
  modelId: string; // real model ID at provider
  description?: string;
  capabilities?: string[];
  fallback?: string;
}

// Routing decision
export interface RoutingDecision {
  provider: string;
  modelId: string;
  fallback?: string;
}