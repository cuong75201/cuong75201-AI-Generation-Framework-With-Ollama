from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field, field_validator

from app.schema.agent import AgentStatus
from app.schema.planner import PlannerResult


class ProjectStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ProjectCreateRequest(BaseModel):
    requirement: str = Field(min_length=1, max_length=10_000)

    @field_validator("requirement")
    @classmethod
    def requirement_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("requirement must not be blank")
        return value


class ProjectCreateResponse(BaseModel):
    project_id: str
    status: ProjectStatus
    message: str
    created_at: datetime


class ProjectStatusResponse(BaseModel):
    project_id: str
    status: ProjectStatus
    current_agent: str | None = None
    steps: dict[str, AgentStatus]
    planner_result: PlannerResult | None = None
    error: str | None = None

