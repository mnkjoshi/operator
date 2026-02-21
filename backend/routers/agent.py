from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os

router = APIRouter()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-pro')

class AgentRequest(BaseModel):
    message: str
    context: str | None = None

class AgentResponse(BaseModel):
    response: str
    action: str | None = None

@router.post("/chat", response_model=AgentResponse)
async def chat_with_agent(request: AgentRequest):
    """
    Main chat endpoint for the multimodal AI agent
    Uses Gemini for understanding and generating responses
    """
    try:
        # Build prompt with accessibility context
        system_prompt = """You are an accessibility-focused AI assistant called Operator.
Your purpose is to help users with high-accessibility requirements interact with digital content.
Always provide clear, simple, and concise responses.
If asked to simplify content, break it down into easy-to-understand language.
If asked to explain something, use plain language without jargon."""

        full_prompt = f"{system_prompt}\n\nUser: {request.message}"
        if request.context:
            full_prompt += f"\n\nContext: {request.context}"

        # Generate response
        response = model.generate_content(full_prompt)
        
        return AgentResponse(
            response=response.text,
            action=None  # TODO: Parse action intents from response
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

@router.post("/action")
async def perform_action(action: str, content: str | None = None):
    """
    Execute specific actions like 'read', 'simplify', 'explain'
    """
    try:
        if action == "simplify":
            prompt = f"Simplify this content for easy understanding:\n\n{content}"
        elif action == "explain":
            prompt = f"Explain this content in simple terms:\n\n{content}"
        elif action == "read":
            # This will be handled by TTS endpoint
            return {"message": "Use /api/speech/tts endpoint for reading"}
        else:
            return {"error": "Unknown action"}

        response = model.generate_content(prompt)
        return {"response": response.text}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Action error: {str(e)}")
