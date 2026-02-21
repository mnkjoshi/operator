# Operator

Gemini-only browser automation app with:

1. Main panel: embedded Playwright-controlled browser view (streamed screenshots).
2. Sidebar: chat interface for natural-language instructions.
3. Backend loop: Gemini interprets intent and returns actions (`navigate`, `click_at`, `type_text_at`, `scroll_*`, etc.).
4. Real-time feedback: SSE events stream state, actions, assistant output, and completion.

## Architecture

### Runtime Flow

1. User sends instruction in sidebar.
2. Frontend calls `POST /api/gemini`.
3. Backend creates/reuses Playwright session.
4. Backend sends text + screenshot context to Gemini computer-use model.
5. Gemini emits function calls.
6. Backend executes actions in Playwright, captures updated screenshot + URL.
7. Backend streams updates back to frontend in real time.

### API Endpoints

- `POST /api/gemini`: starts or continues a browser-agent session (SSE response).
- `DELETE /api/gemini/{session_id}`: closes a session.

### SSE Event Contract

- `session`: initial session state (`session_id`, `url`, `screenshot_base64`, `updated_at_ms`)
- `assistant`: Gemini text output for a turn
- `action`: executed browser action + latest browser state
- `done`: final response + final state snapshot
- `error`: normalized error payload

## Prerequisites

- Node.js 18+
- Python 3.9+
- Chromium runtime for Playwright (`python -m playwright install chromium`)

## Local Development

### 1) Backend Setup

```bash
cd backend
python -m pip install -r requirements.txt
python -m playwright install chromium
cp .env.example .env
```

Set `backend/.env`:

- Required:
  - `GEMINI_API_KEY`
- Optional:
  - `GEMINI_COMPUTER_USE_MODEL` (default: `gemini-2.5-computer-use-preview-10-2025`)
  - `GEMINI_COMPUTER_USE_MAX_TURNS` (default: `10`)
  - `GEMINI_AUTO_APPROVE_RISKY_ACTIONS` (default: `false`)
  - `PLAYWRIGHT_HEADLESS` (default: `true`)
  - `PLAYWRIGHT_START_URL` (default: `https://www.google.com`)
  - `PLAYWRIGHT_VIEWPORT_WIDTH` (default: `1440`)
  - `PLAYWRIGHT_VIEWPORT_HEIGHT` (default: `900`)
  - `PLAYWRIGHT_ACTION_SETTLE_MS` (default: `600`)

Run backend:

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2) Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend calls backend at:

- `http://localhost:8000/api/gemini` by default (or `VITE_API_BASE_URL` if set)

## Repository Structure

```text
operator/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── routers/
│   │   └── computer_use.py
│   └── services/
│       └── gemini_computer_use_service.py
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── components/
│       │   ├── AgentPanel.tsx
│       │   ├── Canvas.tsx
│       │   └── Layout.tsx
│       ├── lib/
│       │   └── computerUseClient.ts
│       └── types/
│           └── browser.ts
├── package.json
└── README.md
```

## Common Commands

From repo root:

```bash
npm run dev:frontend
npm run dev:backend
npm run build:frontend
npm run lint:frontend
```

## Validation Checklist

```bash
# Confirm Gemini endpoint references
rg -n --hidden -S "/api/gemini" --glob '!**/node_modules/**' --glob '!.git/**'

# Frontend build
cd frontend && npm run build

# Backend compile checks
python -m py_compile backend/main.py backend/routers/computer_use.py backend/services/gemini_computer_use_service.py
```

## Troubleshooting

- `Missing GEMINI_API_KEY`:
  - Set `GEMINI_API_KEY` in `backend/.env` and restart backend.
- Playwright launch errors:
  - Reinstall browser binaries with `python -m playwright install chromium`.
- Empty browser panel:
  - Send a sidebar instruction and verify SSE events from `POST /api/gemini`.
