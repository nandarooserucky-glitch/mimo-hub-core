# Architecture (MVP)

Client -> Hub API -> Router Engine -> Provider Adapters -> Upstream LLMs

## Core principles
1. Client only knows one base URL + one hub API key.
2. Provider credentials are managed server-side.
3. Model aliases hide provider-specific model IDs.
4. Failures trigger automatic fallback.

## Initial aliases
- smart
- fast
- cheap
- coding
