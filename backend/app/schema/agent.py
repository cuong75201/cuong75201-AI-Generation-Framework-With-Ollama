from datetime import datetime, timezone
from enum import StrEnum
from typing import Generic, TypeVar

from pydantic import BaseModel, Field, model_validator


InputT = TypeVar("InputT")
OutputT = TypeVar("OutputT")


class AgentStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class AgentInput(BaseModel, Generic[InputT]):
    project_id: str = Field(min_length=1)
    data: InputT


class AgentOutput(BaseModel, Generic[OutputT]):
    agent: str = Field(min_length=1)
    status: AgentStatus
    data: OutputT | None = None
    error: str | None = None
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = None

    @model_validator(mode="after")
    def validate_result(self) -> "AgentOutput[OutputT]":
        if self.status == AgentStatus.FAILED and not self.error:
            raise ValueError("error is required when agent status is failed")
        if self.status == AgentStatus.COMPLETED and self.completed_at is None:
            self.completed_at = datetime.now(timezone.utc)
        return self
