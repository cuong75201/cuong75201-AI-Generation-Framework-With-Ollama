from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from app.schema.project import (
    ProjectCreateRequest,
    ProjectCreateResponse,
    ProjectStatusResponse,
)
from app.schema.response import ApiResponse, success_response
from app.workspace.manager import (
    ProjectNotFoundError,
    ProjectSourceNotFoundError,
    create_project_source_archive,
    create_project_workspace,
    get_project_status,
)
from app.agents.planner_agent import PlannerAgent
from app.schema.agent import AgentInput
from app.workflow.orchestrator import WorkflowOrchestrator

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post(
    "",
    response_model=ApiResponse[ProjectCreateResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_project(
    body: ProjectCreateRequest,
    background_tasks: BackgroundTasks,
) -> ApiResponse[ProjectCreateResponse]:
    data = create_project_workspace(body.requirement)
    initial_input = AgentInput(project_id=data.project_id, data=body.requirement)
    orchestrator = WorkflowOrchestrator([PlannerAgent()])
    background_tasks.add_task(orchestrator.run, initial_input)
    return success_response(
        data=data,
        message="Project created successfully",
        status_code=status.HTTP_201_CREATED,
    )


@router.get("/{project_id}", response_model=ApiResponse[ProjectStatusResponse])
async def read_project_status(project_id: str) -> ApiResponse[ProjectStatusResponse]:
    try:
        data = get_project_status(project_id)
    except ProjectNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        ) from exc

    return success_response(data=data, message="Project status retrieved successfully")


@router.get(
    "/{project_id}/download",
    response_class=FileResponse,
    responses={
        200: {"content": {"application/zip": {}}, "description": "Project source ZIP"},
        404: {"description": "Project or project source not found"},
    },
)
async def download_project(project_id: str) -> FileResponse:
    try:
        archive_path = create_project_source_archive(project_id)
    except ProjectNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        ) from exc
    except ProjectSourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project source not found",
        ) from exc

    return FileResponse(
        path=archive_path,
        media_type="application/zip",
        filename=f"project_{project_id}.zip",
        background=BackgroundTask(Path.unlink, archive_path, missing_ok=True),
    )
