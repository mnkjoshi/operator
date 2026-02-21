import asyncio
import base64
import json
import os
import sys
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, AsyncIterator

from google import genai
from google.genai import types
from playwright.async_api import Browser, BrowserContext, Page, Playwright, async_playwright


@dataclass
class GeminiComputerUseError(Exception):
    status_code: int
    error: dict[str, Any]


@dataclass
class BrowserSession:
    session_id: str
    context: BrowserContext
    page: Page
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    last_screenshot_base64: str | None = None
    last_url: str = "about:blank"
    updated_at_ms: int = 0


class GeminiComputerUseService:
    def __init__(self) -> None:
        self.model = os.getenv(
            "GEMINI_COMPUTER_USE_MODEL",
            "gemini-2.5-computer-use-preview-10-2025",
        )
        self.viewport_width = int(os.getenv("PLAYWRIGHT_VIEWPORT_WIDTH", "1440"))
        self.viewport_height = int(os.getenv("PLAYWRIGHT_VIEWPORT_HEIGHT", "900"))
        self.start_url = os.getenv("PLAYWRIGHT_START_URL", "https://www.google.com")
        self.max_turns = int(os.getenv("GEMINI_COMPUTER_USE_MAX_TURNS", "10"))
        self.action_settle_ms = int(os.getenv("PLAYWRIGHT_ACTION_SETTLE_MS", "600"))
        self.auto_approve_risky_actions = (
            os.getenv("GEMINI_AUTO_APPROVE_RISKY_ACTIONS", "false").strip().lower()
            in {"1", "true", "yes", "on"}
        )
        self.headless = (
            os.getenv("PLAYWRIGHT_HEADLESS", "true").strip().lower()
            in {"1", "true", "yes", "on"}
        )

        self._genai_client: genai.Client | None = None
        self._playwright: Playwright | None = None
        self._browser: Browser | None = None
        self._sessions: dict[str, BrowserSession] = {}
        self._state_lock = asyncio.Lock()

    @staticmethod
    def _sse_event(event: str, data: dict[str, Any]) -> str:
        return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=True)}\n\n"

    @staticmethod
    def _now_ms() -> int:
        return int(time.time() * 1000)

    @staticmethod
    def _normalize_error(*, status_code: int, message: str, error_type: str | None = None) -> dict[str, Any]:
        return {
            "message": message,
            "status_code": status_code,
            "type": error_type,
        }

    def _get_client(self) -> genai.Client:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise GeminiComputerUseError(
                status_code=500,
                error=self._normalize_error(
                    status_code=500,
                    message="Missing GEMINI_API_KEY",
                    error_type="configuration_error",
                ),
            )
        if self._genai_client is None:
            self._genai_client = genai.Client(api_key=api_key)
        return self._genai_client

    async def _ensure_browser(self) -> Browser:
        async with self._state_lock:
            if self._browser is not None:
                return self._browser

            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(headless=self.headless)
            return self._browser

    async def _create_session(self) -> BrowserSession:
        browser = await self._ensure_browser()
        session_id = str(uuid.uuid4())
        context = await browser.new_context(
            viewport={"width": self.viewport_width, "height": self.viewport_height}
        )
        page = await context.new_page()
        await page.goto(self.start_url)

        session = BrowserSession(session_id=session_id, context=context, page=page)
        await self._capture_state(session)
        self._sessions[session_id] = session
        return session

    async def get_or_create_session(self, session_id: str | None) -> BrowserSession:
        if session_id:
            session = self._sessions.get(session_id)
            if session is None:
                raise GeminiComputerUseError(
                    status_code=404,
                    error=self._normalize_error(
                        status_code=404,
                        message=f"Unknown session_id: {session_id}",
                        error_type="session_not_found",
                    ),
                )
            return session
        return await self._create_session()

    async def close_session(self, session_id: str) -> bool:
        session = self._sessions.pop(session_id, None)
        if session is None:
            return False
        await session.context.close()
        return True

    async def close_all(self) -> None:
        sessions = list(self._sessions.values())
        self._sessions.clear()
        for session in sessions:
            await session.context.close()

        async with self._state_lock:
            if self._browser is not None:
                await self._browser.close()
                self._browser = None
            if self._playwright is not None:
                await self._playwright.stop()
                self._playwright = None

    @staticmethod
    def _to_int(value: Any, *, key: str) -> int:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"Missing or invalid numeric argument: {key}")
        return int(value)

    def _denorm_x(self, x: int) -> int:
        x_px = int(x / 1000 * self.viewport_width)
        return max(0, min(self.viewport_width - 1, x_px))

    def _denorm_y(self, y: int) -> int:
        y_px = int(y / 1000 * self.viewport_height)
        return max(0, min(self.viewport_height - 1, y_px))

    @staticmethod
    def _safe_args(raw: dict[str, Any]) -> dict[str, Any]:
        safe = dict(raw)
        safe.pop("safety_decision", None)
        return safe

    async def _capture_state(self, session: BrowserSession) -> dict[str, Any]:
        screenshot_bytes = await session.page.screenshot(type="png")
        screenshot_base64 = base64.b64encode(screenshot_bytes).decode("ascii")
        session.last_screenshot_base64 = screenshot_base64
        session.last_url = session.page.url
        session.updated_at_ms = self._now_ms()
        return {
            "url": session.last_url,
            "screenshot_base64": screenshot_base64,
            "updated_at_ms": session.updated_at_ms,
        }

    async def _settle_after_action(self, page: Page) -> None:
        try:
            await page.wait_for_load_state(timeout=5000)
        except Exception:
            pass
        await asyncio.sleep(self.action_settle_ms / 1000.0)

    async def _execute_action(self, *, page: Page, name: str, args: dict[str, Any]) -> dict[str, Any]:
        if "safety_decision" in args and not self.auto_approve_risky_actions:
            return {
                "status": "blocked",
                "message": "Action blocked because safety confirmation is required.",
            }

        try:
            if name == "open_web_browser":
                pass
            elif name == "wait_5_seconds":
                await asyncio.sleep(5)
            elif name == "go_back":
                await page.go_back()
            elif name == "go_forward":
                await page.go_forward()
            elif name == "search":
                await page.goto("https://www.google.com")
                query = args.get("query")
                if isinstance(query, str) and query.strip():
                    await page.keyboard.type(query.strip())
                    await page.keyboard.press("Enter")
            elif name == "navigate":
                url = args.get("url")
                if not isinstance(url, str) or not url.strip():
                    raise ValueError("Missing navigate.url")
                await page.goto(url.strip())
            elif name == "click_at":
                x = self._denorm_x(self._to_int(args.get("x"), key="x"))
                y = self._denorm_y(self._to_int(args.get("y"), key="y"))
                await page.mouse.click(x, y)
            elif name == "hover_at":
                x = self._denorm_x(self._to_int(args.get("x"), key="x"))
                y = self._denorm_y(self._to_int(args.get("y"), key="y"))
                await page.mouse.move(x, y)
            elif name == "type_text_at":
                x = self._denorm_x(self._to_int(args.get("x"), key="x"))
                y = self._denorm_y(self._to_int(args.get("y"), key="y"))
                text = args.get("text")
                if not isinstance(text, str):
                    raise ValueError("Missing type_text_at.text")
                await page.mouse.click(x, y)
                if bool(args.get("clear_before_typing", True)):
                    select_all = "Meta+A" if sys.platform == "darwin" else "Control+A"
                    await page.keyboard.press(select_all)
                    await page.keyboard.press("Backspace")
                await page.keyboard.type(text)
                if bool(args.get("press_enter", True)):
                    await page.keyboard.press("Enter")
            elif name == "key_combination":
                keys = args.get("keys")
                if not isinstance(keys, str) or not keys.strip():
                    raise ValueError("Missing key_combination.keys")
                await page.keyboard.press(keys.strip())
            elif name == "scroll_document":
                direction = str(args.get("direction", "down")).strip().lower()
                if direction == "down":
                    await page.keyboard.press("PageDown")
                elif direction == "up":
                    await page.keyboard.press("PageUp")
                elif direction == "left":
                    await page.evaluate("window.scrollBy(-400, 0)")
                elif direction == "right":
                    await page.evaluate("window.scrollBy(400, 0)")
                else:
                    raise ValueError("Unsupported scroll direction")
            elif name == "scroll_at":
                x = self._denorm_x(self._to_int(args.get("x"), key="x"))
                y = self._denorm_y(self._to_int(args.get("y"), key="y"))
                magnitude = self._to_int(args.get("magnitude", 800), key="magnitude")
                direction = str(args.get("direction", "down")).strip().lower()
                dy = magnitude if direction == "down" else -magnitude
                await page.mouse.move(x, y)
                await page.mouse.wheel(0, dy)
            elif name == "drag_and_drop":
                sx = self._denorm_x(self._to_int(args.get("x"), key="x"))
                sy = self._denorm_y(self._to_int(args.get("y"), key="y"))
                dx = self._denorm_x(
                    self._to_int(args.get("destination_x"), key="destination_x")
                )
                dy = self._denorm_y(
                    self._to_int(args.get("destination_y"), key="destination_y")
                )
                await page.mouse.move(sx, sy)
                await page.mouse.down()
                await page.mouse.move(dx, dy, steps=10)
                await page.mouse.up()
            else:
                return {"status": "error", "message": f"Unsupported action: {name}"}

            await self._settle_after_action(page)
            return {"status": "ok", "message": "Action completed."}
        except Exception as exc:
            return {"status": "error", "message": str(exc)}

    def _config(self) -> types.GenerateContentConfig:
        return types.GenerateContentConfig(
            tools=[
                types.Tool(
                    computer_use=types.ComputerUse(
                        environment=types.Environment.ENVIRONMENT_BROWSER
                    )
                )
            ],
            thinking_config=types.ThinkingConfig(include_thoughts=True),
        )

    def _generate_content(
        self,
        *,
        contents: list[types.Content],
        config: types.GenerateContentConfig,
    ) -> Any:
        client = self._get_client()
        return client.models.generate_content(
            model=self.model,
            contents=contents,
            config=config,
        )

    @staticmethod
    def _candidate_parts(candidate: Any) -> list[Any]:
        content = getattr(candidate, "content", None)
        if content is None:
            return []
        parts = getattr(content, "parts", None)
        if isinstance(parts, list):
            return parts
        return []

    @classmethod
    def _candidate_text(cls, candidate: Any) -> str:
        text_parts: list[str] = []
        for part in cls._candidate_parts(candidate):
            text = getattr(part, "text", None)
            if isinstance(text, str) and text:
                text_parts.append(text)
        return " ".join(text_parts).strip()

    @classmethod
    def _candidate_function_calls(cls, candidate: Any) -> list[Any]:
        calls: list[Any] = []
        for part in cls._candidate_parts(candidate):
            function_call = getattr(part, "function_call", None)
            if function_call is not None and getattr(function_call, "name", None):
                calls.append(function_call)
        return calls

    @staticmethod
    def _build_function_response(
        *,
        name: str,
        payload: dict[str, Any],
    ) -> types.FunctionResponse:
        response_data = {k: v for k, v in payload.items() if k != "screenshot_base64"}
        screenshot_base64 = payload.get("screenshot_base64")

        if isinstance(screenshot_base64, str) and screenshot_base64:
            screenshot_bytes = base64.b64decode(screenshot_base64)
            return types.FunctionResponse(
                name=name,
                response=response_data,
                parts=[
                    types.FunctionResponsePart(
                        inline_data=types.FunctionResponseBlob(
                            mime_type="image/png",
                            data=screenshot_bytes,
                        )
                    )
                ],
            )

        return types.FunctionResponse(name=name, response=response_data)

    async def stream_instruction(
        self,
        *,
        message: str,
        session_id: str | None = None,
        max_turns: int | None = None,
    ) -> AsyncIterator[str]:
        session: BrowserSession | None = None
        turn_limit = max(1, min(30, max_turns if isinstance(max_turns, int) else self.max_turns))

        try:
            session = await self.get_or_create_session(session_id)
            async with session.lock:
                state = await self._capture_state(session)
                yield self._sse_event(
                    "session",
                    {"session_id": session.session_id, **state},
                )

                initial_png = base64.b64decode(state["screenshot_base64"])
                contents: list[types.Content] = [
                    types.Content(
                        role="user",
                        parts=[
                            types.Part(text=message.strip()),
                            types.Part.from_bytes(data=initial_png, mime_type="image/png"),
                        ],
                    )
                ]
                config = self._config()
                last_text = ""

                for turn in range(turn_limit):
                    response = await asyncio.to_thread(
                        self._generate_content,
                        contents=contents,
                        config=config,
                    )

                    candidates = getattr(response, "candidates", None)
                    if not isinstance(candidates, list) or not candidates:
                        raise GeminiComputerUseError(
                            status_code=502,
                            error=self._normalize_error(
                                status_code=502,
                                message="Gemini returned no candidates.",
                                error_type="provider_error",
                            ),
                        )

                    candidate = candidates[0]
                    candidate_content = getattr(candidate, "content", None)
                    if candidate_content is not None:
                        contents.append(candidate_content)

                    text = self._candidate_text(candidate)
                    if text:
                        last_text = text
                        yield self._sse_event(
                            "assistant",
                            {
                                "session_id": session.session_id,
                                "text": text,
                                "turn": turn + 1,
                            },
                        )

                    function_calls = self._candidate_function_calls(candidate)
                    if not function_calls:
                        final_state = await self._capture_state(session)
                        yield self._sse_event(
                            "done",
                            {
                                "session_id": session.session_id,
                                "response": last_text,
                                "model": self.model,
                                **final_state,
                            },
                        )
                        return

                    function_responses: list[types.FunctionResponse] = []
                    for function_call in function_calls:
                        name = str(getattr(function_call, "name", "unknown"))
                        raw_args = dict(getattr(function_call, "args", {}) or {})
                        action_result = await self._execute_action(
                            page=session.page,
                            name=name,
                            args=raw_args,
                        )
                        action_state = await self._capture_state(session)
                        action_payload = {
                            "session_id": session.session_id,
                            "action": name,
                            "args": self._safe_args(raw_args),
                            **action_result,
                            **action_state,
                        }

                        yield self._sse_event("action", action_payload)
                        function_responses.append(
                            self._build_function_response(name=name, payload=action_payload)
                        )

                    contents.append(
                        types.Content(
                            role="user",
                            parts=[
                                types.Part(function_response=function_response)
                                for function_response in function_responses
                            ],
                        )
                    )

                final_state = await self._capture_state(session)
                yield self._sse_event(
                    "done",
                    {
                        "session_id": session.session_id,
                        "response": last_text or "Reached action limit before completion.",
                        "model": self.model,
                        **final_state,
                    },
                )
        except GeminiComputerUseError as exc:
            yield self._sse_event(
                "error",
                {"session_id": session.session_id if session else session_id, "error": exc.error},
            )
        except Exception as exc:
            error = self._normalize_error(
                status_code=500,
                message=f"Computer-use request failed: {exc}",
                error_type="internal_error",
            )
            yield self._sse_event(
                "error",
                {"session_id": session.session_id if session else session_id, "error": error},
            )
