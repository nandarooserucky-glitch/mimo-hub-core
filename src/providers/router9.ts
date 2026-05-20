import type { ChatCompletionRequest, ChatCompletionResponse } from '../types/index.js';
import { BaseProvider } from './base.js';

export class Router9Provider extends BaseProvider {
  readonly defaultModel = 'Racikan';

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const model = request.model || this.defaultModel;
    const payload = this.buildPayload({ ...request, model });

    const res = await this.client.post('/chat/completions', payload, {
      headers: { Accept: 'application/json' },
    });

    return res.data as ChatCompletionResponse;
  }
}