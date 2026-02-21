# Deployment

## Runtime Scope

This service exposes one API route only:
- `POST /api/openrouter`

## Required Environment

Set at deploy time:
- `OPENROUTER_API_KEY`

Recommended:
- `OPENROUTER_MODEL`
- `OPENROUTER_FALLBACK_MODELS`
- `OPENROUTER_APP_URL`
- `OPENROUTER_APP_NAME`
- `OPENROUTER_TIMEOUT_SECONDS`
- `OPENROUTER_MAX_RETRIES`
- `OPENROUTER_RETRY_BASE_MS`
- `OPENROUTER_PROVIDER_ALLOW_FALLBACKS`
- `OPENROUTER_PROVIDER_REQUIRE_PARAMETERS`
- `OPENROUTER_PROVIDER_SORT`

## Start Command

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Health/Monitoring

No custom health endpoint is exposed. Monitor service readiness through process health and successful responses from `POST /api/openrouter`.
