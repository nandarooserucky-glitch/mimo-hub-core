import type { ChatCompletionRequest, ChatCompletionResponse } from '../types/index.js';
import { BaseProvider } from './base.js';

export class OpenAIProvider extends BaseProvider {
  readonly defaultModel = 'gpt-4o-mini';

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const model = request.model || this.defaultModel;
    const payload = this.buildPayload({ ...request, model });

    const res = await this.client.post('/chat/completions', payload, {
      headers: { Accept: 'application/json' },
    });

    return res.data as ChatCompletionResponse;
  }
}