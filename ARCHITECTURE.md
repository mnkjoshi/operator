# Architecture

## Overview

The backend is intentionally minimal:

1. FastAPI receives `POST /api/openrouter`.
2. Router validates a safe request contract (`message`, `context`, `stream`).
3. `OpenRouterClient` builds and sends a request to OpenRouter chat completions.
4. Response is returned as JSON (`stream=false`) or SSE (`stream=true`).

## OpenRouter Integration

- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Auth: `Authorization: Bearer OPENROUTER_API_KEY`
- Optional headers: `HTTP-Referer`, `X-Title`
- Routing defaults:
  - `provider.allow_fallbacks=true`
  - `provider.require_parameters=true`
  - `provider.sort=throughput`
- Retry policy for transient failures:
  - `408`, `429`, `5xx`, and network timeouts

## Exposed Backend Endpoint

- `POST /api/openrouter`

No additional business endpoints are exposed.
