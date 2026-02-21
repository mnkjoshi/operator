# Operator Backend

Minimal FastAPI backend exposing a single OpenRouter endpoint.

## API Surface

- `POST /api/openrouter`

No other application endpoints are provided.

## Request Contract

```json
{
  "message": "Required user message",
  "context": "Optional context",
  "stream": true
}
```

- `message` is required.
- `context` is optional.
- `stream` defaults to `true`.

## Response Contract

### Non-stream (`stream=false`)

```json
{
  "response": "...",
  "model": "openai/gpt-oss-120b"
}
```

### Stream (`stream=true`)

SSE events:
- `event: delta` with partial text
- `event: done` with final payload `{ "response": "...", "model": "..." }`
- `event: error` with normalized upstream error

## Environment Variables

Required:
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

## Run

```bash
pip install -r requirements.txt
cp .env.example .env
python main.py
```
