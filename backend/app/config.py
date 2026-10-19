from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    llm_provider: str = "ollama"
    llm_model: str = "qwen2.5-coder:7b"
    ollama_base_url: str = "http://localhost:11434"
    llm_timeout: float = Field(default=180.0, gt=0)
    max_retry: int = Field(default=2, ge=0)

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
