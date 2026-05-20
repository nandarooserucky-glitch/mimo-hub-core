import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(8080),
  HOST: z.string().default('0.0.0.0'),
  HUB_API_KEY: z.string().min(16),

  ROUTER9_BASE_URL: z.string().url().optional(),
  ROUTER9_API_KEY: z.string().optional(),
  ROUTER9_DEFAULT_MODEL: z.string().default('Racikan'),

  OPENAI_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_DEFAULT_MODEL: z.string().default('gpt-4o-mini'),

  DB_PROVIDER: z.enum(['sqlite', 'postgres']).default('sqlite'),
  SQLITE_PATH: z.string().default('./data/mimo-hub.db'),
  DATABASE_URL: z.string().optional(),
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY minimal 32 chars'),

  APP_BASE_URL: z.string().url().default('http://localhost:8080'),
  CORS_ORIGINS: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
});
export type AppEnv = z.infer<typeof envSchema>;
export function loadEnv(): AppEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) throw new Error(parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; '));
  return parsed.data;
}
export function normalizeBaseUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
}
