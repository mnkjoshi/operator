# Operator Backend

Backend API for the Operator accessibility platform.

## Features

- **Multimodal AI Agent**: Powered by Google Gemini for understanding and responding to user queries
- **Speech-to-Text**: OpenAI Whisper integration for voice input
- **Text-to-Speech**: ElevenLabs for natural voice output
- **Content Simplification**: AI-powered content simplification for better accessibility

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Add your API keys to `.env`:
   - `GEMINI_API_KEY`: Get from Google AI Studio
   - `OPENAI_API_KEY`: Get from OpenAI Platform
   - `ELEVENLABS_API_KEY`: Get from ElevenLabs

4. Run the server:
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Health Check
- `GET /` - Basic health check
- `GET /api/health` - Detailed health check with service status

### Agent
- `POST /api/agent/chat` - Chat with the AI agent
- `POST /api/agent/action` - Execute specific actions (simplify, explain, read)

### Speech
- `POST /api/speech/stt` - Speech-to-Text (Whisper)
- `POST /api/speech/tts` - Text-to-Speech (ElevenLabs)
- `GET /api/speech/voices` - List available voices

### Simplify
- `POST /api/simplify/` - Simplify complex content
- `POST /api/simplify/remove-noise` - Remove ads and unnecessary elements

## Development

API documentation available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
