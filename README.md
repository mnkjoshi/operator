# Operator

**Eliminate technological barriers for users with high-accessibility requirements**

Operator is a multimodal AI agent that translates complex digital environments into simple, accessible interfaces. Built with WCAG 2.2 AAA compliance, Operator provides a voice-first, keyboard-accessible experience for users with visual, motor, or cognitive impairments.

## 🌟 Mission

Break down digital barriers using AI to create a universally accessible web experience where everyone can interact with content naturally, regardless of their abilities.

## ✨ Features

### Frontend
- 🎨 **Clarity Design System**: WCAG 2.2 AAA compliant with high-contrast themes
- 🗣️ **Voice-First Interface**: Microphone-enabled AI interactions
- 📱 **Responsive Layout**: 70% Canvas (content) + 30% Agent Panel (assistant)
- ⌨️ **Full Keyboard Navigation**: No mouse required
- 🔍 **Automatic Focus Management**: Screen reader optimized routing
- 📏 **Large Touch Targets**: 48x48px minimum for motor accessibility
- 🔤 **Atkinson Hyperlegible**: Ultra-readable typography, 18px base

### Backend
- 🤖 **Gemini AI**: Multimodal understanding and content simplification
- 🎙️ **OpenAI Whisper**: High-quality speech-to-text
- 🔊 **ElevenLabs**: Natural text-to-speech output
- 🧹 **Content Cleaning**: Remove ads, popups, and noise
- 💡 **Smart Actions**: Read aloud, simplify, explain

## 🏗️ Architecture

```
operator/
├── frontend/              # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/    # Canvas, AgentPanel, etc.
│   │   ├── pages/         # Route pages
│   │   └── index.css      # Clarity Design System
│   ├── .storybook/        # Component documentation
│   └── package.json
│
└── backend/               # FastAPI + Python
    ├── routers/           # API endpoints
    │   ├── agent.py       # Gemini chat & actions
    │   ├── speech.py      # STT/TTS
    │   └── simplify.py    # Content simplification
    ├── main.py            # FastAPI application
    └── requirements.txt
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.9+ (for backend)
- **API Keys** (see setup below)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at [http://localhost:3000](http://localhost:3000)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Copy and configure .env
cp .env.example .env
# Add your API keys to .env

python main.py
```

Backend API at [http://localhost:8000](http://localhost:8000)

API Documentation at [http://localhost:8000/docs](http://localhost:8000/docs)

### API Keys Required

1. **Gemini API**: [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **OpenAI API**: [OpenAI Platform](https://platform.openai.com/api-keys)
3. **ElevenLabs API**: [ElevenLabs](https://elevenlabs.io/)

Add to `backend/.env`:
```env
GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
```

## 📚 Documentation

- **Frontend README**: [frontend/README.md](frontend/README.md)
- **Backend README**: [backend/README.md](backend/README.md)
- **API Docs**: http://localhost:8000/docs (when running)
- **Storybook**: `cd frontend && npm run storybook`

## 🎨 Clarity Design System

### Colors (High Contrast)
- Dark canvas: `#121212` / Text: `#FFFFFF`
- Light canvas: `#FAFAFA` / Text: `#000000`
- Focus/Listening: `#FFB000` (Amber)

### Typography
- **Font**: Atkinson Hyperlegible
- **Size**: 18px base (scalable to 300%)
- **Line Height**: 1.5x

### Interaction
- **Touch Targets**: Minimum 48x48px
- **Focus**: 3px amber outline, visible for keyboard only
- **Animations**: Respects `prefers-reduced-motion`

## 🧪 Testing

### Accessibility Testing

```bash
# Frontend linting (blocks build if rules violated)
cd frontend
npm run lint

# Storybook with a11y addon
npm run storybook
```

### Manual Testing Checklist

- [ ] Screen reader (NVDA/JAWS/VoiceOver)
- [ ] Keyboard-only navigation (no mouse)
- [ ] Browser zoom to 300%
- [ ] High contrast mode
- [ ] Color blindness simulation
- [ ] Touch targets on mobile

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (fast HMR)
- Tailwind CSS
- Radix UI (accessible primitives)
- React Router + react-helmet-async
- ESLint with jsx-a11y (strict)
- Storybook + a11y addon

### Backend
- FastAPI (Python)
- Google Gemini (multimodal AI)
- OpenAI Whisper (STT)
- ElevenLabs (TTS)
- Uvicorn (ASGI server)

## 📖 Key Concepts

### Canvas (70%)
The main viewport displaying simplified, noise-free content with maximum readability.

### Agent Panel (30%)
Voice-first sidebar with:
- Microphone toggle (large, accessible)
- Chat log (high-contrast, ARIA live region)
- Action buttons (read, simplify, explain)

### Focus Management
On route changes, focus automatically moves to the page's `<h1>` or main element, ensuring screen readers announce navigation.

### Semantic HTML
All components use proper HTML5 elements (`<main>`, `<aside>`, `<nav>`) with ARIA attributes only when necessary.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Ensure accessibility compliance:
   - Run `npm run lint` (frontend)
   - Test with screen readers
   - Verify keyboard navigation
   - Check touch target sizes
4. Write Storybook stories for new components
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Atkinson Hyperlegible** by Braille Institute
- **Radix UI** for accessible component primitives
- **WCAG Guidelines** by W3C
- All contributors to web accessibility standards

## 📞 Support

For questions or issues:
- GitHub Issues: [operator/issues](https://github.com/yourusername/operator/issues)
- Documentation: See READMEs in `frontend/` and `backend/`

---

**Built with ❤️ for accessibility**
