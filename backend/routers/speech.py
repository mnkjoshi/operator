from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import openai
from elevenlabs import generate, set_api_key
import os
import io

router = APIRouter()

# Configure APIs
openai.api_key = os.getenv("OPENAI_API_KEY")
set_api_key(os.getenv("ELEVENLABS_API_KEY"))

class TTSRequest(BaseModel):
    text: str
    voice: str = "Rachel"  # ElevenLabs voice

@router.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    """
    Speech-to-Text using OpenAI Whisper
    Converts user voice input to text
    """
    try:
        # Read audio file
        audio_data = await audio.read()
        
        # Use Whisper API
        client = openai.OpenAI()
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio,
            response_format="text"
        )
        
        return {
            "text": transcript,
            "confidence": 1.0  # Whisper doesn't provide confidence scores
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"STT error: {str(e)}")

@router.post("/tts")
async def text_to_speech(request: TTSRequest):
    """
    Text-to-Speech using ElevenLabs
    Converts agent responses to natural speech
    """
    try:
        # Generate audio using ElevenLabs
        audio = generate(
            text=request.text,
            voice=request.voice,
            model="eleven_monolingual_v1"
        )
        
        # Convert to streaming response
        return StreamingResponse(
            io.BytesIO(audio),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment; filename=speech.mp3"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")

@router.get("/voices")
async def list_voices():
    """
    List available TTS voices
    """
    try:
        from elevenlabs import voices
        available_voices = voices()
        
        return {
            "voices": [
                {"id": v.voice_id, "name": v.name}
                for v in available_voices
            ]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice list error: {str(e)}")
