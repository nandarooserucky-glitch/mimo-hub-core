import axios, { AxiosInstance } from 'axios';
import type { ProviderConfig, ChatCompletionRequest, ChatCompletionResponse } from '../types/index.js';
import { normalizeBaseUrl } from '../config/env.js';

export abstract class BaseProvider {
  protected client: AxiosInstance;
  protected readonly config: ProviderConfig;
  readonly name: string;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.name = config.name;
    this.client = axios.create({
      baseURL: normalizeBaseUrl(config.baseUrl),
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(config.headers ?? {}),
      },
      timeout: config.timeout ?? 60_000,
    });
  }

  abstract chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;

  async health(): Promise<boolean> {
    try {
      const res = await this.client.get('/models');
      return res.status === 200;
    } catch {
      return false;
    }
  }

  protected buildPayload(request: ChatCompletionRequest): Record<string, unknown> {
    const { model, messages, temperature, max_tokens, top_p, stream, presence_penalty, frequency_penalty, stop } = request;
    const payload: Record<string, unknown> = { model, messages };
    if (temperature !== undefined) payload.temperature = temperature;
    if (max_tokens !== undefined) payload.max_tokens = max_tokens;
    if (top_p !== undefined) payload.top_p = top_p;
    if (stream !== undefined) payload.stream = stream;
    if (presence_penalty !== undefined) payload.presence_penalty = presence_penalty;
    if (frequency_penalty !== undefined) payload.frequency_penalty = frequency_penalty;
    if (stop !== undefined) payload.stop = stop;
    return payload;
  }
}