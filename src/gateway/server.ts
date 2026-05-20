import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import * as crypto from 'node:crypto';
import { z } from 'zod';
import { loadEnv } from '../config/env.js';
import { RouterEngine } from '../router/engine.js';
import { Router9Provider } from '../providers/router9.js';
import { OpenAIProvider } from '../providers/openai.js';
import { CredentialStore } from '../db/store.js';
import { registerOAuthRoutes } from '../auth/oauth.js';
import { pickBestProvider } from '../policy/scorer.js';

const env = loadEnv();
const app = Fastify({ logger: true });

const chatSchema = z.object({
  model: z.string().min(1),
  messages: z.array(z.object({ role: z.enum(['system','user','assistant']), content: z.string().min(1) })).min(1),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
  stream: z.boolean().optional(),
});

const router9 = new Router9Provider({ name: 'router9', baseUrl: env.ROUTER9_BASE_URL ?? 'https://router.example.com', apiKey: env.ROUTER9_API_KEY ?? '' });
const openai = new OpenAIProvider({ name: 'openai', baseUrl: env.OPENAI_BASE_URL, apiKey: env.OPENAI_API_KEY ?? '' });
const providers: Record<string, Router9Provider | OpenAIProvider> = { router9, openai };
const router = new RouterEngine();
const store = new CredentialStore(env.SQLITE_PATH, env.ENCRYPTION_KEY);

const providerHealth: Record<string, { healthy: boolean; avgLatencyMs: number; costRank: number; priority: number }> = {
  router9: { healthy: true, avgLatencyMs: 380, costRank: 4, priority: 10 },
  openai: { healthy: true, avgLatencyMs: 420, costRank: 6, priority: 7 },
};

const allowedOrigins = (process.env.CORS_ORIGINS ?? '').split(',').map(s=>s.trim()).filter(Boolean);
await app.register(cors, { origin: (origin, cb) => {
  if (!origin) return cb(null, true);
  if (allowedOrigins.length === 0) return cb(new Error('CORS blocked'), false);
  cb(null, allowedOrigins.includes(origin));
}});
await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

async function authGuard(request: any) {
  if (!env.HUB_API_KEY) throw Object.assign(new Error('HUB_API_KEY required'), { statusCode: 500 });
  const key = request.headers['x-api-key'];
  if (!key || typeof key !== 'string' || !safeEqual(key, env.HUB_API_KEY)) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  }
}

registerOAuthRoutes(app, env, store);

app.setErrorHandler((error: any, _req, reply) => {
  const code = error?.statusCode ?? 500;
  reply.code(code).send({ error: code >=500 ? 'Internal server error' : String(error?.message ?? 'error') });
});

app.get('/health', async () => ({ status: 'ok', timestamp: Date.now() }));
app.get('/models', { preHandler: authGuard }, async () => ({ object: 'list', data: router.listAliases().map(a => ({ id: a.alias, object: 'model', owned_by: a.provider })) }));

app.post('/v1/chat/completions', { preHandler: authGuard }, async (request: any) => {
  const parsed = chatSchema.safeParse(request.body);
  if (!parsed.success) throw Object.assign(new Error(parsed.error.issues.map(i=>i.message).join('; ')), { statusCode: 400 });
  const body = parsed.data;
  const decision = router.resolve(body.model || env.ROUTER9_DEFAULT_MODEL);

  const primaryName = decision.provider; // respect alias/router decision
  const primary = providers[primaryName];
  if (!primary) throw Object.assign(new Error('Provider unavailable'), { statusCode: 503 });

  try {
    const started = Date.now();
    const res = await primary.chat({ ...body, model: decision.modelId });
    providerHealth[primaryName].healthy = true;
    providerHealth[primaryName].avgLatencyMs = Math.round(providerHealth[primaryName].avgLatencyMs * 0.8 + (Date.now()-started)*0.2);
    return res;
  } catch {
    providerHealth[primaryName].healthy = false;
    const ranked = pickBestProvider([
      { name: 'router9', ...providerHealth.router9 },
      { name: 'openai', ...providerHealth.openai },
    ]);
    const fallbackName = ranked?.name && ranked.name !== primaryName ? ranked.name : (decision.fallback ?? 'openai');
    const fallback = providers[fallbackName];
    if (!fallback) throw Object.assign(new Error('No fallback provider'), { statusCode: 503 });
    const fallbackModel = fallbackName === 'openai' ? env.OPENAI_DEFAULT_MODEL : env.ROUTER9_DEFAULT_MODEL;
    const res = await fallback.chat({ ...body, model: fallbackModel });
    providerHealth[fallbackName].healthy = true;
    return res;
  }
});

const addr = await app.listen({ port: env.PORT, host: env.HOST });
app.log.info(`running at ${addr}`);
