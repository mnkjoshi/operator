from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from services.openrouter_client import OpenRouterAPIError, OpenRouterClient

router = APIRouter()
client = OpenRouterClient()


class OpenRouterRequest(BaseModel):
    class Config:
        extra = "forbid"

    message: str = Field(..., min_length=1)
    context: str | None = None
    stream: bool = True


class OpenRouterResponse(BaseModel):
    response: str
    model: str


@router.post("/openrouter")
async def chat_with_openrouter(request: OpenRouterRequest):
    if request.stream:
        return StreamingResponse(
            client.stream_chat_events(message=request.message, context=request.context),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    try:
        text, model = await client.generate_chat(message=request.message, context=request.context)
        return OpenRouterResponse(response=text, model=model)
    except OpenRouterAPIError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.error) from exc
