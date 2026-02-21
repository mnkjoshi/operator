# Operator - Project Structure

```
operator/
│
├── 📁 frontend/                      # React + Vite + TypeScript Frontend
│   ├── 📁 .storybook/               # Storybook configuration
│   │   ├── main.ts                  # Storybook setup with a11y addon
│   │   └── preview.tsx              # Theme switching and decorators
│   │
│   ├── 📁 src/
│   │   ├── 📁 components/           # Reusable UI components
│   │   │   ├── Layout.tsx           # Main layout with focus management
│   │   │   ├── Canvas.tsx           # 70% main viewport
│   │   │   ├── AgentPanel.tsx       # 30% AI assistant sidebar
│   │   │   ├── MicrophoneButton.tsx # Voice input toggle (48x48px)
│   │   │   ├── ChatLog.tsx          # High-contrast conversation log
│   │   │   ├── ActionButtons.tsx    # One-tap actions (read, simplify, explain)
│   │   │   ├── *.stories.tsx        # Storybook stories for each component
│   │   │   └── ...
│   │   │
│   │   ├── 📁 pages/                # Route pages
│   │   │   └── Home.tsx             # Homepage with welcome content
│   │   │
│   │   ├── App.tsx                  # Root React component with routing
│   │   ├── App.css                  # Component-specific styles
│   │   ├── main.tsx                 # Application entry point
│   │   └── index.css                # Global Clarity Design System styles
│   │
│   ├── .eslintrc.cjs                # ESLint with jsx-a11y (strict)
│   ├── index.html                   # HTML template with meta tags
│   ├── package.json                 # Dependencies and scripts
│   ├── tailwind.config.js           # Clarity Design System configuration
│   ├── postcss.config.js            # PostCSS with Tailwind
│   ├── tsconfig.json                # TypeScript configuration
│   ├── tsconfig.node.json           # TypeScript for Vite config
│   ├── vite.config.ts               # Vite build configuration
│   └── README.md                    # Frontend documentation
│
├── 📁 backend/                       # FastAPI Python Backend
│   ├── 📁 routers/                  # API route handlers
│   │   ├── __init__.py              # Package initializer
│   │   ├── agent.py                 # Gemini chat & actions
│   │   ├── speech.py                # Whisper STT + ElevenLabs TTS
│   │   └── simplify.py              # Content simplification & noise removal
│   │
│   ├── main.py                      # FastAPI application & CORS
│   ├── requirements.txt             # Python dependencies
│   ├── .env.example                 # Environment variables template
│   ├── .env                         # API keys (create from .env.example)
│   └── README.md                    # Backend documentation
│
├── 📁 .vscode/                       # VSCode workspace settings
│   ├── settings.json                # Editor configuration
│   └── extensions.json              # Recommended extensions
│
├── .gitignore                        # Git ignore rules
├── setup.ps1                         # Windows PowerShell setup script
├── package.json                      # Root package with workspace scripts
├── LICENSE                           # MIT License
├── README.md                         # Main project documentation
├── CONTRIBUTING.md                   # Contribution guidelines
└── PROJECT_STRUCTURE.md              # This file

```

## 📂 Directory Details

### Frontend Components (`frontend/src/components`)

| Component            | Purpose                | Accessibility Features                                        |
| -------------------- | ---------------------- | ------------------------------------------------------------- |
| **Layout**           | Main app structure     | Focus management on route changes, skip-to-content link       |
| **Canvas**           | Content viewport (70%) | Semantic regions, aria-label, high contrast                   |
| **AgentPanel**       | AI sidebar (30%)       | Voice-first, ARIA live regions, proper landmarks              |
| **MicrophoneButton** | Voice input toggle     | 48x48px touch target, aria-pressed state, keyboard accessible |
| **ChatLog**          | Conversation history   | ARIA log role, live announcements, high contrast              |
| **ActionButtons**    | Quick actions          | 48x48px targets, descriptive labels, keyboard navigation      |

### Backend Routes (`backend/routers`)

| Route           | Endpoints                                                  | Purpose                         |
| --------------- | ---------------------------------------------------------- | ------------------------------- |
| **agent.py**    | `/api/agent/chat`, `/api/agent/action`                     | Gemini-powered chat and actions |
| **speech.py**   | `/api/speech/stt`, `/api/speech/tts`, `/api/speech/voices` | Speech processing               |
| **simplify.py** | `/api/simplify/`, `/api/simplify/remove-noise`             | Content simplification          |

## 🎨 Clarity Design System Files

### Frontend Styling

- **`tailwind.config.js`**: Defines color palette, typography, spacing
- **`src/index.css`**: Global styles, focus indicators, theme support
- **`src/App.css`**: Component utilities, skip-to-content styles

### Design Tokens

```javascript
colors: {
  clarity: {
    dark: { canvas: '#121212', text: '#FFFFFF' },
    light: { canvas: '#FAFAFA', text: '#000000' },
    focus: '#FFB000'  // Amber for focus & listening
  }
}

fontFamily: {
  sans: ['Atkinson Hyperlegible', ...]
}

fontSize: {
  base: ['18px', { lineHeight: '1.5' }]
}

spacing: {
  touch: '48px'  // Minimum touch target
}
```

## 🔧 Configuration Files

### Frontend

- **`.eslintrc.cjs`**: Enforces jsx-a11y rules (strict mode)
- **`vite.config.ts`**: Vite build settings, dev server port 3000
- **`tsconfig.json`**: TypeScript strict mode, React JSX
- **`.storybook/main.ts`**: Storybook with a11y addon
- **`.storybook/preview.tsx`**: Theme switcher, WCAG test configuration

### Backend

- **`.env.example`**: Template for API keys
- **`requirements.txt`**: Python packages (FastAPI, Gemini, OpenAI, ElevenLabs)

### Workspace

- **`.vscode/settings.json`**: Auto-format, TypeScript settings, Python linting
- **`.vscode/extensions.json`**: Recommended VSCode extensions

## 📜 Scripts

### Root (`package.json`)

```bash
npm run setup              # Run PowerShell setup script
npm run dev:frontend       # Start Vite dev server
npm run dev:backend        # Start FastAPI server
npm run build:frontend     # Build for production
npm run lint:frontend      # Run ESLint (a11y checks)
npm run storybook          # Open Storybook
```

### Frontend (`frontend/package.json`)

```bash
npm run dev                # Vite dev server (port 3000)
npm run build              # Production build
npm run lint               # ESLint with jsx-a11y
npm run preview            # Preview production build
npm run storybook          # Storybook dev server (port 6006)
npm run build-storybook    # Build Storybook for deployment
```

### Backend (`backend/main.py`)

```bash
python main.py             # Start FastAPI server (port 8000)
# or
uvicorn main:app --reload  # Manual uvicorn start
```

## 🌐 URLs During Development

| Service            | URL                         | Purpose                       |
| ------------------ | --------------------------- | ----------------------------- |
| Frontend           | http://localhost:3000       | Main application              |
| Backend API        | http://localhost:8000       | REST API                      |
| API Docs (Swagger) | http://localhost:8000/docs  | Interactive API documentation |
| API Docs (ReDoc)   | http://localhost:8000/redoc | Alternative API docs          |
| Storybook          | http://localhost:6006       | Component library             |

## 🧪 Testing & QA

### Automated

- **ESLint jsx-a11y**: Catches accessibility violations during build
- **Storybook a11y addon**: Visual accessibility testing
- **TypeScript**: Type safety across the codebase

### Manual Testing Required

1. Screen reader compatibility (NVDA, JAWS, VoiceOver)
2. Keyboard-only navigation
3. Browser zoom up to 300%
4. High contrast mode
5. Touch target size verification (mobile)
6. Color contrast ratio validation

## 📦 Dependencies

### Frontend Key Dependencies

- `react` + `react-dom`: UI library
- `react-router-dom`: SPA routing
- `react-helmet-async`: Document head management
- `@radix-ui/*`: Accessible component primitives
- `vite`: Build tool
- `tailwindcss`: Utility-first CSS

### Frontend Dev Dependencies

- `eslint-plugin-jsx-a11y`: Accessibility linting
- `@storybook/react`: Component documentation
- `@storybook/addon-a11y`: Accessibility testing addon
- `typescript`: Type checking

### Backend Dependencies

- `fastapi`: Web framework
- `uvicorn`: ASGI server
- `google-generativeai`: Gemini API
- `openai`: Whisper STT
- `elevenlabs`: Text-to-speech
- `python-dotenv`: Environment variables

## 🚀 Deployment Considerations

### Frontend

- Build output: `frontend/dist/`
- Static hosting compatible (Vercel, Netlify, etc.)
- Environment variables in build process

### Backend

- ASGI server required (uvicorn, gunicorn)
- API keys via environment variables
- CORS configured for production domains

## 📝 Documentation Files

| File                   | Contents                               |
| ---------------------- | -------------------------------------- |
| `README.md`            | Main project overview and quick start  |
| `frontend/README.md`   | Frontend-specific documentation        |
| `backend/README.md`    | Backend API documentation              |
| `CONTRIBUTING.md`      | Contribution guidelines and code style |
| `PROJECT_STRUCTURE.md` | This file - project architecture       |

---

## 🎯 Key Architecture Decisions

### Why Vite?

Fast HMR enables rapid accessibility testing and iteration cycles.

### Why Radix UI?

Provides headless, accessible components with ARIA attributes and focus management built-in.

### Why Tailwind CSS?

Utility-first approach allows quick implementation of Clarity Design System tokens while maintaining consistency.

### Why FastAPI?

Modern Python framework with automatic OpenAPI docs, async support, and type validation via Pydantic.

### Why Gemini + Whisper + ElevenLabs?

- **Gemini**: Multimodal understanding for content simplification
- **Whisper**: State-of-the-art speech-to-text accuracy
- **ElevenLabs**: Most natural-sounding text-to-speech

---

**Last Updated**: February 2026
