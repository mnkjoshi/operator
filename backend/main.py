from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from routers import agent, speech, simplify

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Operator API",
    description="Multimodal AI agent for accessibility",
    version="1.0.0"
)

# CORS middleware for frontend communication
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])
app.include_router(speech.router, prefix="/api/speech", tags=["speech"])
app.include_router(simplify.router, prefix="/api/simplify", tags=["simplify"])

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Operator API",
        "version": "1.0.0"
    }

@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "gemini": os.getenv("GEMINI_API_KEY") is not None,
            "openai": os.getenv("OPENAI_API_KEY") is not None,
            "elevenlabs": os.getenv("ELEVENLABS_API_KEY") is not None,
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "True").lower() == "true"
    )
