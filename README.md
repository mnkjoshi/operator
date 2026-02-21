# Operator

Operator now provides a minimal OpenRouter-only backend integration.

## Backend API

Single endpoint:
- `POST /api/openrouter`

Request:
- `message` (required string)
- `context` (optional string)
- `stream` (optional boolean, default `true`)

Responses:
- `stream=false`: JSON `{ response, model }`
- `stream=true`: SSE events `delta`, `done`, `error`

## Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
python main.py
```

Required backend env:
- `OPENROUTER_API_KEY`

## Notes

- All Gemini/OpenAI/ElevenLabs integrations were removed.
- All previous `/api/agent/*`, `/api/simplify/*`, and `/api/speech/*` endpoints were removed.
