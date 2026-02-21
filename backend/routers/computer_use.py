from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from services.gemini_computer_use_service import GeminiComputerUseService

router = APIRouter()
service = GeminiComputerUseService()


class GeminiRequest(BaseModel):
    class Config:
        extra = "forbid"

    message: str = Field(..., min_length=1)
    session_id: str | None = None
    max_turns: int | None = Field(default=None, ge=1, le=30)


class CloseSessionResponse(BaseModel):
    closed: bool


@router.post("/gemini")
async def run_gemini(request: GeminiRequest):
    return StreamingResponse(
        service.stream_instruction(
            message=request.message,
            session_id=request.session_id,
            max_turns=request.max_turns,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.delete("/gemini/{session_id}", response_model=CloseSessionResponse)
async def close_gemini_session(session_id: str):
    closed = await service.close_session(session_id)
    return CloseSessionResponse(closed=closed)
