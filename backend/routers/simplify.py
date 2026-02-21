from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os

router = APIRouter()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-pro')

class SimplifyRequest(BaseModel):
    content: str
    level: str = "simple"  # simple, very_simple, eli5

class SimplifyResponse(BaseModel):
    original: str
    simplified: str
    reading_level: str

@router.post("/", response_model=SimplifyResponse)
async def simplify_content(request: SimplifyRequest):
    """
    Simplify complex content for better accessibility
    Uses Gemini to rewrite content in simpler language
    """
    try:
        # Build prompt based on simplification level
        prompts = {
            "simple": "Rewrite this content in simple, clear language that anyone can understand:",
            "very_simple": "Rewrite this content in very simple language, using short sentences and common words:",
            "eli5": "Explain this like I'm 5 years old, using the simplest possible language:"
        }
        
        prompt = f"{prompts.get(request.level, prompts['simple'])}\n\n{request.content}"
        
        response = model.generate_content(prompt)
        
        return SimplifyResponse(
            original=request.content,
            simplified=response.text,
            reading_level=request.level
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simplification error: {str(e)}")

@router.post("/remove-noise")
async def remove_noise(content: str):
    """
    Remove ads, popups, and unnecessary elements from content
    Returns clean, focused content
    """
    try:
        prompt = f"""Extract only the main content from this text, removing:
- Advertisements
- Pop-ups
- Cookie notices
- Navigation menus
- Sidebars
- Footer content

Return only the primary, valuable content:

{content}"""
        
        response = model.generate_content(prompt)
        
        return {
            "clean_content": response.text,
            "removed_elements": ["ads", "navigation", "footer"]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Noise removal error: {str(e)}")
