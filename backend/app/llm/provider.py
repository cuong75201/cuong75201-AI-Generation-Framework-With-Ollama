import httpx

from app.config import Settings, get_settings


class LLMProvider:
    def __init__(
        self,
        settings: Settings | None = None,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        if self.settings.llm_provider.lower() != "ollama":
            raise ValueError(f"Unsupported LLM provider: {self.settings.llm_provider}")
        self.model = self.settings.llm_model
        self.base_url = self.settings.ollama_base_url.rstrip("/")
        self.timeout = self.settings.llm_timeout
        self.max_retry = self.settings.max_retry
        self._client = client

    async def chat(self, system_prompt: str, user_prompt: str) -> str:
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "stream": False,
        }

        if self._client is not None:
            return await self._chat_with_retry(self._client, payload)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            return await self._chat_with_retry(client, payload)

    async def _chat_with_retry(
        self,
        client: httpx.AsyncClient,
        payload: dict[str, object],
    ) -> str:
        for attempt in range(self.max_retry + 1):
            try:
                response = await client.post(f"{self.base_url}/api/chat", json=payload)
                response.raise_for_status()
                return response.json()["message"]["content"]
            except (httpx.TimeoutException, httpx.NetworkError):
                if attempt == self.max_retry:
                    raise
            except httpx.HTTPStatusError as exc:
                retryable = exc.response.status_code == 429 or exc.response.status_code >= 500
                if attempt == self.max_retry or not retryable:
                    raise

        raise RuntimeError("LLM request failed without an error")
