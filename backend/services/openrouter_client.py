import asyncio
import json
import os
import random
from dataclasses import dataclass
from typing import Any, AsyncIterator

import httpx


TRANSIENT_STATUS_CODES = {408, 429, 500, 502, 503, 504}
DEFAULT_SYSTEM_PROMPT = "You are a concise, helpful assistant."


@dataclass
class OpenRouterAPIError(Exception):
    status_code: int
    error: dict[str, Any]
    retry_after: float | None = None


class OpenRouterClient:
    def __init__(
        self,
        *,
        api_key: str | None = None,
        model: str | None = None,
        fallback_models: list[str] | None = None,
        app_url: str | None = None,
        app_name: str | None = None,
        timeout_seconds: float | None = None,
        max_retries: int | None = None,
        retry_base_ms: int | None = None,
        provider_sort: str | None = None,
        allow_fallbacks: bool | None = None,
        require_parameters: bool | None = None,
    ) -> None:
        self.chat_completions_url = "https://openrouter.ai/api/v1/chat/completions"
        self.responses_url = "https://openrouter.ai/api/v1/responses"
        self.api_key = api_key if api_key is not None else os.getenv("OPENROUTER_API_KEY")
        self.model = model if model is not None else os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-120b")

        fallback_from_env = os.getenv("OPENROUTER_FALLBACK_MODELS", "")
        parsed_fallback = [
            item.strip()
            for item in fallback_from_env.split(",")
            if item.strip()
        ]
        self.fallback_models = fallback_models if fallback_models is not None else parsed_fallback

        self.app_url = app_url if app_url is not None else os.getenv("OPENROUTER_APP_URL")
        self.app_name = app_name if app_name is not None else os.getenv("OPENROUTER_APP_NAME")

        self.timeout_seconds = float(
            timeout_seconds if timeout_seconds is not None else os.getenv("OPENROUTER_TIMEOUT_SECONDS", "45")
        )
        self.max_retries = int(
            max_retries if max_retries is not None else os.getenv("OPENROUTER_MAX_RETRIES", "2")
        )
        self.retry_base_ms = int(
            retry_base_ms if retry_base_ms is not None else os.getenv("OPENROUTER_RETRY_BASE_MS", "300")
        )
        self.provider_sort = (
            provider_sort if provider_sort is not None else os.getenv("OPENROUTER_PROVIDER_SORT", "throughput")
        )
        self.allow_fallbacks = self._parse_bool(
            allow_fallbacks if allow_fallbacks is not None else os.getenv("OPENROUTER_PROVIDER_ALLOW_FALLBACKS", "true")
        )
        self.require_parameters = self._parse_bool(
            require_parameters if require_parameters is not None else os.getenv("OPENROUTER_PROVIDER_REQUIRE_PARAMETERS", "true")
        )

    @staticmethod
    def _parse_bool(value: Any) -> bool:
        if isinstance(value, bool):
            return value
        return str(value).strip().lower() in {"1", "true", "yes", "on"}

    @staticmethod
    def _coerce_content_to_text(content: Any) -> str:
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            parts: list[str] = []
            for item in content:
                if isinstance(item, dict):
                    if "text" in item and isinstance(item["text"], str):
                        parts.append(item["text"])
                    elif item.get("type") == "text" and isinstance(item.get("text"), str):
                        parts.append(item["text"])
            return "".join(parts)
        return ""

    def _normalize_error(
        self,
        *,
        status_code: int,
        raw_error: dict[str, Any] | None = None,
        fallback_message: str = "OpenRouter request failed",
        request_id: str | None = None,
    ) -> dict[str, Any]:
        raw_error = raw_error or {}
        return {
            "code": raw_error.get("code"),
            "type": raw_error.get("type"),
            "message": raw_error.get("message") or fallback_message,
            "param": raw_error.get("param"),
            "status_code": status_code,
            "request_id": request_id,
        }

    def _headers(self) -> dict[str, str]:
        if not self.api_key:
            raise OpenRouterAPIError(
                status_code=500,
                error=self._normalize_error(
                    status_code=500,
                    fallback_message="Missing OPENROUTER_API_KEY",
                ),
            )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        if self.app_url:
            headers["HTTP-Referer"] = self.app_url
        if self.app_name:
            headers["X-Title"] = self.app_name
        return headers

    def _payload(self, *, message: str, context: str | None, stream: bool) -> dict[str, Any]:
        user_text = message.strip()
        if context:
            user_text = f"{user_text}\n\nContext:\n{context.strip()}"

        payload: dict[str, Any] = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": DEFAULT_SYSTEM_PROMPT},
                {"role": "user", "content": user_text},
            ],
            "stream": stream,
            "provider": {
                "allow_fallbacks": self.allow_fallbacks,
                "require_parameters": self.require_parameters,
                "sort": self.provider_sort,
            },
        }
        if self.fallback_models:
            payload["models"] = self.fallback_models
        if stream:
            payload["stream_options"] = {"include_usage": True}
        return payload

    def _responses_payload(self, *, message: str, context: str | None, stream: bool) -> dict[str, Any]:
        user_text = message.strip()
        if context:
            user_text = f"{user_text}\n\nContext:\n{context.strip()}"

        payload: dict[str, Any] = {
            "model": self.model,
            "input": [
                {"role": "system", "content": DEFAULT_SYSTEM_PROMPT},
                {"role": "user", "content": user_text},
            ],
            "stream": stream,
            "reasoning": {
                "enabled": True,
                "summary": "auto",
            },
            "provider": {
                "allow_fallbacks": self.allow_fallbacks,
                "require_parameters": self.require_parameters,
                "sort": self.provider_sort,
            },
        }
        if self.fallback_models:
            payload["models"] = self.fallback_models
        return payload

    @staticmethod
    def _retry_after_seconds(header_value: str | None) -> float | None:
        if not header_value:
            return None
        try:
            return max(0.0, float(header_value))
        except ValueError:
            return None

    @staticmethod
    def _is_retryable_error(error: OpenRouterAPIError) -> bool:
        return error.status_code in TRANSIENT_STATUS_CODES

    async def _sleep(self, seconds: float) -> None:
        await asyncio.sleep(seconds)

    def _retry_delay_seconds(self, attempt: int, retry_after: float | None) -> float:
        if retry_after is not None:
            return min(10.0, retry_after)
        base_seconds = max(0.05, self.retry_base_ms / 1000.0)
        backoff = base_seconds * (2 ** attempt)
        jitter = random.uniform(0, base_seconds)
        return min(10.0, backoff + jitter)

    async def _post_json_once(self, payload: dict[str, Any], *, use_responses_api: bool = False) -> dict[str, Any]:
        timeout = httpx.Timeout(self.timeout_seconds)
        async with httpx.AsyncClient(timeout=timeout) as client:
            url = self.responses_url if use_responses_api else self.chat_completions_url
            response = await client.post(url, headers=self._headers(), json=payload)

        request_id = response.headers.get("x-request-id")
        if response.status_code >= 400:
            raw_error: dict[str, Any] = {}
            message = "OpenRouter returned an error"
            try:
                body = response.json()
                if isinstance(body, dict):
                    raw_error = body.get("error", {}) if isinstance(body.get("error"), dict) else {}
                    message = raw_error.get("message", message)
            except Exception:
                if response.text:
                    message = response.text

            raise OpenRouterAPIError(
                status_code=response.status_code,
                error=self._normalize_error(
                    status_code=response.status_code,
                    raw_error=raw_error,
                    fallback_message=message,
                    request_id=request_id,
                ),
                retry_after=self._retry_after_seconds(response.headers.get("retry-after")),
            )

        try:
            return response.json()
        except Exception as exc:
            raise OpenRouterAPIError(
                status_code=502,
                error=self._normalize_error(
                    status_code=502,
                    fallback_message=f"Invalid JSON from OpenRouter: {exc}",
                    request_id=request_id,
                ),
            ) from exc

    async def _post_json_with_retries(self, payload: dict[str, Any], *, use_responses_api: bool = False) -> dict[str, Any]:
        for attempt in range(self.max_retries + 1):
            try:
                return await self._post_json_once(payload, use_responses_api=use_responses_api)
            except OpenRouterAPIError as exc:
                if attempt >= self.max_retries or not self._is_retryable_error(exc):
                    raise
                await self._sleep(self._retry_delay_seconds(attempt, exc.retry_after))
            except (httpx.TimeoutException, httpx.RequestError) as exc:
                if attempt >= self.max_retries:
                    raise OpenRouterAPIError(
                        status_code=504,
                        error=self._normalize_error(
                            status_code=504,
                            fallback_message=f"OpenRouter network error: {exc}",
                        ),
                    ) from exc
                await self._sleep(self._retry_delay_seconds(attempt, None))

        raise OpenRouterAPIError(
            status_code=500,
            error=self._normalize_error(status_code=500, fallback_message="Unexpected retry loop exit"),
        )

    @staticmethod
    def _extract_response_output_text(response_payload: dict[str, Any]) -> str:
        output = response_payload.get("output")
        if not isinstance(output, list):
            return ""
        parts: list[str] = []
        for item in output:
            if not isinstance(item, dict):
                continue
            content = item.get("content")
            if not isinstance(content, list):
                continue
            for content_item in content:
                if not isinstance(content_item, dict):
                    continue
                item_type = content_item.get("type")
                if item_type == "output_text" and isinstance(content_item.get("text"), str):
                    parts.append(content_item["text"])
        return "".join(parts)

    def _extract_text_response(self, payload: dict[str, Any]) -> tuple[str, str]:
        model = str(payload.get("model", self.model))
        choices = payload.get("choices")
        if not isinstance(choices, list) or not choices:
            return "", model

        first = choices[0] if isinstance(choices[0], dict) else {}
        message = first.get("message") if isinstance(first, dict) else {}
        content: Any = message.get("content") if isinstance(message, dict) else None

        text = self._coerce_content_to_text(content)
        if not text and isinstance(first, dict):
            text = self._coerce_content_to_text(first.get("text"))

        return text, model

    async def generate_chat(self, *, message: str, context: str | None = None) -> tuple[str, str]:
        payload = self._responses_payload(message=message, context=context, stream=False)
        data = await self._post_json_with_retries(payload, use_responses_api=True)
        model = str(data.get("model", self.model))
        text = self._extract_response_output_text(data)
        if text:
            return text, model
        return self._extract_text_response(data)

    @staticmethod
    def _sse_event(event: str, data: dict[str, Any]) -> str:
        return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=True)}\n\n"

    def _extract_delta(self, chunk: dict[str, Any]) -> str:
        choices = chunk.get("choices")
        if not isinstance(choices, list) or not choices:
            return ""
        first = choices[0] if isinstance(choices[0], dict) else {}
        delta = first.get("delta") if isinstance(first, dict) else {}
        content = delta.get("content") if isinstance(delta, dict) else None
        return self._coerce_content_to_text(content)

    @staticmethod
    def _extract_response_error(chunk: dict[str, Any]) -> dict[str, Any] | None:
        if not isinstance(chunk, dict):
            return None
        error = chunk.get("error")
        return error if isinstance(error, dict) else None

    async def stream_chat_events(
        self, *, message: str, context: str | None = None
    ) -> AsyncIterator[str]:
        payload = self._responses_payload(message=message, context=context, stream=True)

        for attempt in range(self.max_retries + 1):
            assembled: list[str] = []
            thought_assembled: list[str] = []
            model = self.model
            started = False

            try:
                timeout = httpx.Timeout(self.timeout_seconds)
                async with httpx.AsyncClient(timeout=timeout) as client:
                    async with client.stream(
                        "POST",
                        self.responses_url,
                        headers=self._headers(),
                        json=payload,
                    ) as response:
                        request_id = response.headers.get("x-request-id")
                        if response.status_code >= 400:
                            body = await response.aread()
                            raw_error: dict[str, Any] = {}
                            fallback_message = "OpenRouter stream request failed"
                            try:
                                parsed = json.loads(body.decode("utf-8"))
                                if isinstance(parsed, dict):
                                    raw_error = (
                                        parsed.get("error", {})
                                        if isinstance(parsed.get("error"), dict)
                                        else {}
                                    )
                                    fallback_message = raw_error.get("message", fallback_message)
                            except Exception:
                                pass

                            raise OpenRouterAPIError(
                                status_code=response.status_code,
                                error=self._normalize_error(
                                    status_code=response.status_code,
                                    raw_error=raw_error,
                                    fallback_message=fallback_message,
                                    request_id=request_id,
                                ),
                                retry_after=self._retry_after_seconds(response.headers.get("retry-after")),
                            )

                        async for line in response.aiter_lines():
                            if not line or not line.startswith("data:"):
                                continue

                            data = line[5:].strip()
                            if data == "[DONE]":
                                yield self._sse_event(
                                    "done",
                                    {
                                        "response": "".join(assembled),
                                        "thought_summary": "".join(thought_assembled),
                                        "model": model,
                                    },
                                )
                                return

                            try:
                                chunk = json.loads(data)
                            except json.JSONDecodeError:
                                continue

                            chunk_error = self._extract_response_error(chunk)
                            if chunk_error is not None:
                                raise OpenRouterAPIError(
                                    status_code=502,
                                    error=self._normalize_error(
                                        status_code=502,
                                        raw_error=chunk_error,
                                        fallback_message="OpenRouter returned an error event",
                                        request_id=request_id,
                                    ),
                                )

                            if isinstance(chunk, dict):
                                chunk_type = chunk.get("type")
                                if not isinstance(chunk_type, str):
                                    continue

                                if chunk_type == "response.output_text.delta":
                                    delta_text = chunk.get("delta")
                                    if isinstance(delta_text, str) and delta_text:
                                        started = True
                                        assembled.append(delta_text)
                                        yield self._sse_event("delta", {"delta": delta_text})
                                    continue

                                if chunk_type == "response.reasoning_summary_text.delta":
                                    thought_delta = chunk.get("delta")
                                    if isinstance(thought_delta, str) and thought_delta:
                                        started = True
                                        thought_assembled.append(thought_delta)
                                        yield self._sse_event("thought_delta", {"delta": thought_delta})
                                    continue

                                if chunk_type == "response.reasoning_summary_text.done":
                                    thought_text = chunk.get("text")
                                    if isinstance(thought_text, str):
                                        if not thought_assembled:
                                            thought_assembled.append(thought_text)
                                        yield self._sse_event("thought_done", {"summary": thought_text})
                                    continue

                                if chunk_type == "response.completed":
                                    response_obj = chunk.get("response")
                                    if isinstance(response_obj, dict):
                                        response_model = response_obj.get("model")
                                        if isinstance(response_model, str) and response_model:
                                            model = response_model
                                        final_text = self._extract_response_output_text(response_obj)
                                        if final_text:
                                            assembled = [final_text]
                                    thought_text = "".join(thought_assembled)
                                    if thought_text:
                                        yield self._sse_event("thought_done", {"summary": thought_text})
                                    yield self._sse_event(
                                        "done",
                                        {
                                            "response": "".join(assembled),
                                            "thought_summary": thought_text,
                                            "model": model,
                                        },
                                    )
                                    return

                        yield self._sse_event(
                            "done",
                            {
                                "response": "".join(assembled),
                                "thought_summary": "".join(thought_assembled),
                                "model": model,
                            },
                        )
                        return
            except OpenRouterAPIError as exc:
                if not started and attempt < self.max_retries and self._is_retryable_error(exc):
                    await self._sleep(self._retry_delay_seconds(attempt, exc.retry_after))
                    continue
                yield self._sse_event("error", {"error": exc.error})
                return
            except (httpx.TimeoutException, httpx.RequestError) as exc:
                if not started and attempt < self.max_retries:
                    await self._sleep(self._retry_delay_seconds(attempt, None))
                    continue
                error = self._normalize_error(
                    status_code=504,
                    fallback_message=f"OpenRouter network error: {exc}",
                )
                yield self._sse_event("error", {"error": error})
                return
