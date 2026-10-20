import asyncio
import base64
import binascii
import json
import re
from pathlib import Path

import httpx

from app.core.config import Settings


MORI_REFERENCE_PATH = Path(__file__).resolve().parents[1] / "assets" / "mori.png"
MORI_REFERENCE_MAX_BYTES = 2 * 1024 * 1024
MORI_IMAGE_INSTRUCTIONS = (
    "Create a warm illustrated Mori in a photorealistic setting, following the scene description below. "
    "Use the attached reference as a character identity guide; do not copy its expression, pose or background. "
    "Preserve Mori's fluffy ivory fur, long floppy ears, black eyes, pink cheeks, "
    "two-leaf sprout on the head, green backpack and proportions. "
    "Follow the specified setting, action, clothing and expression; allow natural, indoor or urban settings. "
    "Add clothing without obscuring Mori's identity; do not replace Mori with another animal. "
    "Do not default to sadness or impose a forced smile; express the specified emotion through eyes, mouth and body language. "
    "Keep the face and gesture readable, with room around the sprout and ears; a full-body shot is optional. "
    "Render the background as a real photograph with realistic textures, depth and lighting, not cartoon or watercolor. "
    "For Mori only, use soft digital painting with delicate watercolor texture, rounded volume and fine fur; do not photorealistically redesign Mori as a real animal. "
    "Match lighting direction, color temperature, perspective and contact shadows to the setting, not as a sticker. "
    "Preserve the scene's mood and recognizable surroundings without excessive blur, harsh contrast, hard outlines or 3D rendering. "
    "Fill the frame without white margins. Do not reserve blank space for a message. "
    "Do not include readable text, lettering, titles, dates, borders, film strips, UI or watermarks, or real human faces. "
)


class AIConfigurationError(Exception):
    """Configuration errors contain field names only, never secret values."""


class AIRequestError(Exception):
    def __init__(self, code: str, *, uncertain: bool, status_code: int | None = None) -> None:
        super().__init__("AI provider request failed")
        self.code = code
        self.uncertain = uncertain
        self.status_code = status_code


class _ProviderClient:
    """Use the app's HTTP client without retrying or exposing provider errors."""

    def __init__(self, http_client: httpx.AsyncClient, settings: Settings, *, timeout_seconds: float) -> None:
        self.http_client = http_client
        self.settings = settings
        self.timeout_seconds = timeout_seconds

    async def _json_response(self, request: httpx.Request, *, max_bytes: int) -> dict:
        response = None
        try:
            async with asyncio.timeout(self.timeout_seconds):
                response = await self.http_client.send(request, stream=True, follow_redirects=False)
                if not 200 <= response.status_code < 300:
                    code = "RATE_LIMITED" if response.status_code == 429 else "PROVIDER_ERROR"
                    raise AIRequestError(code, uncertain=response.status_code >= 500 or
                                         response.status_code in (408, 409),
                                         status_code=response.status_code)
                body = bytearray()
                async for chunk in response.aiter_bytes():
                    if len(body) + len(chunk) > max_bytes:
                        raise AIRequestError("RESPONSE_TOO_LARGE", uncertain=True)
                    body.extend(chunk)
                parsed = json.loads(body)
                if not isinstance(parsed, dict):
                    raise ValueError("Invalid JSON object")
                return parsed
        except (httpx.ConnectError, httpx.ConnectTimeout, httpx.PoolTimeout):
            raise AIRequestError("CONNECTION_FAILED", uncertain=False) from None
        except (TimeoutError, httpx.TimeoutException):
            raise AIRequestError("TIMEOUT", uncertain=True) from None
        except httpx.HTTPError:
            raise AIRequestError("PROVIDER_ERROR", uncertain=True) from None
        except (ValueError, UnicodeError):
            raise AIRequestError("INVALID_RESPONSE", uncertain=True) from None
        finally:
            if response is not None:
                try:
                    await response.aclose()
                except httpx.HTTPError:
                    raise AIRequestError("PROVIDER_ERROR", uncertain=True) from None


class CodysseyClient(_ProviderClient):
    def __init__(self, http_client: httpx.AsyncClient, settings: Settings) -> None:
        super().__init__(http_client, settings, timeout_seconds=settings.ai_timeout_seconds)

    def _headers(self) -> dict[str, str]:
        key = self.settings.ai_api_key.get_secret_value()
        if not re.fullmatch(r"[\x21-\x7e]+", key):
            raise AIConfigurationError("AI_API_KEY must be a non-empty ASCII token")
        return {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}

    def build_text_request(self, messages: list[dict[str, str]]) -> httpx.Request:
        return self.http_client.build_request(
            "POST", self.settings.ai_text_url, headers=self._headers(),
            json={"model": self.settings.ai_text_model, "messages": messages},
            timeout=self.timeout_seconds,
        )

    async def generate_text(self, messages: list[dict[str, str]]) -> str:
        payload = await self._json_response(self.build_text_request(messages), max_bytes=65536)
        try:
            choice = payload["choices"][0]
            message = choice["message"]
            content = message["content"]
            if (choice["finish_reason"] != "stop" or message["role"] != "assistant"
                    or not isinstance(content, str) or not content.strip()):
                raise ValueError()
            return content
        except (KeyError, IndexError, TypeError, ValueError):
            raise AIRequestError("INVALID_RESPONSE", uncertain=True) from None


class GeminiClient(_ProviderClient):
    def __init__(self, http_client: httpx.AsyncClient, settings: Settings) -> None:
        super().__init__(http_client, settings, timeout_seconds=settings.gemini_timeout_seconds)
        self._mori_reference_data: str | None = None

    def _reference_image_data(self) -> str:
        if self._mori_reference_data is None:
            try:
                with MORI_REFERENCE_PATH.open("rb") as reference:
                    data = reference.read(MORI_REFERENCE_MAX_BYTES + 1)
            except OSError:
                raise AIConfigurationError("Mori reference image must be a readable PNG") from None
            if not data.startswith(b"\x89PNG\r\n\x1a\n") or len(data) > MORI_REFERENCE_MAX_BYTES:
                raise AIConfigurationError("Mori reference image must be a PNG within 2 MiB")
            self._mori_reference_data = base64.b64encode(data).decode("ascii")
        return self._mori_reference_data

    def _headers(self) -> dict[str, str]:
        key = self.settings.gemini_api_key.get_secret_value()
        if not re.fullmatch(r"[\x21-\x7e]+", key):
            raise AIConfigurationError("GEMINI_API_KEY must be a non-empty ASCII token")
        return {"x-goog-api-key": key, "Content-Type": "application/json"}

    def validate_configuration(self) -> None:
        if not self.settings.gemini_image_model:
            raise AIConfigurationError("GEMINI_IMAGE_MODEL must be configured")
        self._headers()
        self._reference_image_data()

    def build_image_request(self, prompt: str) -> httpx.Request:
        self.validate_configuration()
        return self.http_client.build_request(
            "POST", self.settings.gemini_image_url, headers=self._headers(),
            json={"contents": [{"role": "user", "parts": [
                      {"text": MORI_IMAGE_INSTRUCTIONS},
                      {"inlineData": {"mimeType": "image/png", "data": self._reference_image_data()}},
                      {"text": prompt},
                  ]}],
                  "generationConfig": {"responseModalities": ["TEXT", "IMAGE"],
                                       "imageConfig": {"aspectRatio": self.settings.gemini_image_aspect_ratio}}},
            timeout=self.timeout_seconds,
        )

    def _response_parts(self, payload: dict) -> list[dict]:
        try:
            candidate = payload["candidates"][0]
            content = candidate["content"]
            parts = content["parts"]
            if (payload.get("promptFeedback", {}).get("blockReason")
                    or candidate["finishReason"] != "STOP" or content["role"] != "model"
                    or not isinstance(parts, list) or not parts
                    or any(not isinstance(part, dict) for part in parts)):
                raise ValueError()
            return [part for part in parts if not part.get("thought")]
        except (KeyError, IndexError, TypeError, ValueError, AttributeError):
            raise AIRequestError("INVALID_RESPONSE", uncertain=True) from None

    async def generate_image(self, prompt: str) -> bytes:
        """Receive Base64 bytes; the caller validates the image before uploading."""
        if not isinstance(prompt, str) or not prompt.strip():
            raise ValueError("Image prompt must not be blank")
        max_bytes = self.settings.storage_max_file_size_bytes
        encoded_limit = 4 * ((max_bytes + 2) // 3)
        payload = await self._json_response(self.build_image_request(prompt),
                                            max_bytes=encoded_limit + 65536)
        try:
            image = next(part["inlineData"] for part in self._response_parts(payload) if "inlineData" in part)
            if image["mimeType"] not in ("image/png", "image/jpeg", "image/webp"):
                raise ValueError("Invalid image MIME type")
            encoded = image["data"]
            if not isinstance(encoded, str) or not encoded or len(encoded) > encoded_limit:
                raise ValueError("Invalid encoded image")
            data = base64.b64decode(encoded, validate=True)
            if not data or len(data) > max_bytes:
                raise ValueError("Invalid image size")
        except (KeyError, IndexError, TypeError, ValueError, StopIteration, binascii.Error):
            raise AIRequestError("INVALID_RESPONSE", uncertain=True) from None
        return data
