from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from routers import openrouter

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Operator API",
    description="OpenRouter-only API",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
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

# Include only the OpenRouter router
app.include_router(openrouter.router, prefix="/api", tags=["openrouter"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "True").lower() == "true"
    )
