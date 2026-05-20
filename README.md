# MiMo Hub Core

Unified LLM hub: one endpoint + one API key, backend auto-routes to providers.

## Implemented
- OpenAI-compatible:
  - `GET /models`
  - `POST /v1/chat/completions`
- OAuth connect endpoints (MVP):
  - `GET /connect/google`
  - `GET /connect/github`
  - `GET /connect/microsoft`
  - `GET /connect/:provider/callback`
- Encrypted credential store (SQLite, AES-256-GCM)
- Dynamic provider picker (latency/cost/health scoring)
- Primary: 9Router (`Racikan`), fallback: OpenAI-compatible

## Run
```bash
npm install
cp .env.example .env
npm run dev
```

## Quick test
```bash
curl -s http://localhost:8080/health
curl -s -H "x-api-key: change-me" http://localhost:8080/models
```

## Notes
- OAuth callback currently stores authorization code encrypted (MVP).
- Next production step: token exchange with provider token endpoints.
