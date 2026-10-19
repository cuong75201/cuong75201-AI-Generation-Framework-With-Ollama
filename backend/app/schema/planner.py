from typing import Literal

from pydantic import BaseModel, Field


class ApiSpec(BaseModel):
    method: Literal["GET", "POST", "PUT", "PATCH", "DELETE"]
    path: str
    description: str


class PlannerResult(BaseModel):
    project_name: str = Field(min_length=1)
    description: str = Field(min_length=1)
    technologies: list[str]
    features: list[str]
    database: str | None = None
    apis: list[ApiSpec]
    project_structure: list[str]
