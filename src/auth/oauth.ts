import type { FastifyInstance } from 'fastify';
import { CredentialStore } from '../db/store.js';

type OAuthProvider = 'google' | 'github' | 'microsoft';

interface OAuthConfig {
  authUrl: string;
  tokenUrl: string;
  scope: string;
  clientId?: string;
  clientSecret?: string;
}

function providerConfig(provider: OAuthProvider, env: any): OAuthConfig {
  const redirect = `${env.APP_BASE_URL}/connect/${provider}/callback`;
  const configs: Record<OAuthProvider, OAuthConfig> = {
    google: {
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID ?? ''}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=${encodeURIComponent('openid email profile')}&access_type=offline&prompt=consent`,
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scope: 'openid email profile',
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      authUrl: `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID ?? ''}&redirect_uri=${encodeURIComponent(redirect)}&scope=${encodeURIComponent('read:user user:email')}`,
      tokenUrl: 'https://github.com/login/oauth/access_token',
      scope: 'read:user user:email',
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    microsoft: {
      authUrl: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${env.MICROSOFT_CLIENT_ID ?? ''}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=${encodeURIComponent('openid email profile offline_access')}`,
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      scope: 'openid email profile offline_access',
      clientId: env.MICROSOFT_CLIENT_ID,
      clientSecret: env.MICROSOFT_CLIENT_SECRET,
    },
  };
  return configs[provider];
}

export function registerOAuthRoutes(app: FastifyInstance, env: any, store: CredentialStore) {
  for (const provider of ['google', 'github', 'microsoft'] as OAuthProvider[]) {
    app.get(`/connect/${provider}`, async () => {
      const cfg = providerConfig(provider, env);
      return {
        provider,
        configured: Boolean(cfg.clientId && cfg.clientSecret),
        authUrl: cfg.authUrl,
        callbackUrl: `${env.APP_BASE_URL}/connect/${provider}/callback`,
      };
    });

    app.get<{ Querystring: { code?: string; user_id?: string } }>(`/connect/${provider}/callback`, async (req) => {
      const userId = req.query.user_id ?? 'default';
      const code = req.query.code;
      if (!code) return { ok: false, provider, error: 'missing code' };

      // MVP behavior: store the authorization code encrypted.
      // Production next step: exchange code -> access_token using tokenUrl/client_secret.
      store.upsertConnection(userId, provider, `oauth-code:${code}`);
      return { ok: true, provider, userId, stored: true };
    });
  }
}
