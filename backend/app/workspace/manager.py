import json
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from app.schema.agent import AgentStatus
from app.schema.planner import PlannerResult
from app.schema.project import ProjectCreateResponse, ProjectStatus, ProjectStatusResponse


GENERATED_PROJECTS_DIR = Path(__file__).resolve().parents[2] / "generated_projects"


class ProjectNotFoundError(Exception):
    pass


class ProjectSourceNotFoundError(Exception):
    pass


def _write_json(path: Path, data: dict[str, object]) -> None:
    temporary_path = path.with_suffix(f"{path.suffix}.tmp")
    temporary_path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    temporary_path.replace(path)


def _get_project_dir(project_id: str) -> Path:
    """Return a project directory without allowing path traversal."""
    if not project_id or Path(project_id).name != project_id or project_id in {".", ".."}:
        raise ProjectNotFoundError(project_id)

    project_dir = GENERATED_PROJECTS_DIR / project_id
    if not project_dir.is_dir():
        raise ProjectNotFoundError(project_id)
    return project_dir


def create_project_workspace(requirement: str) -> ProjectCreateResponse:
    project_id = uuid4().hex
    project_dir = GENERATED_PROJECTS_DIR / project_id
    created_at = datetime.now(timezone.utc)

    (project_dir / "project").mkdir(parents=True)
    (project_dir / ".agent").mkdir()
    (project_dir / "logs").mkdir()

    metadata = {
        "project_id": project_id,
        "requirement": requirement,
        "status": ProjectStatus.QUEUED,
        "created_at": created_at.isoformat(),
        "agents": {
            "planner": "pending",
            "coder": "pending",
            "tester": "pending",
            "reviewer": "pending",
        },
    }
    _write_json(project_dir / "metadata.json", metadata)

    return ProjectCreateResponse(
        project_id=project_id,
        status=ProjectStatus.QUEUED,
        message="Project created and queued for processing",
        created_at=created_at,
    )


def get_project_status(project_id: str) -> ProjectStatusResponse:
    project_dir = _get_project_dir(project_id)
    metadata_path = project_dir / "metadata.json"
    if not metadata_path.is_file():
        raise ProjectNotFoundError(project_id)

    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    steps = {
        name: AgentStatus(agent_status)
        for name, agent_status in metadata.get("agents", {}).items()
    }
    current_agent = metadata.get("current_agent")
    if current_agent is None:
        current_agent = next(
            (name for name, agent_status in steps.items() if agent_status == AgentStatus.RUNNING),
            None,
        )

    planner_result = None
    planner_result_path = project_dir / ".agent" / "planner.json"
    if planner_result_path.is_file():
        planner_result = PlannerResult.model_validate_json(
            planner_result_path.read_text(encoding="utf-8")
        )

    return ProjectStatusResponse(
        project_id=metadata["project_id"],
        status=ProjectStatus(metadata["status"]),
        current_agent=current_agent,
        steps=steps,
        planner_result=planner_result,
        error=metadata.get("error"),
    )


def update_project_progress(
    project_id: str,
    *,
    project_status: ProjectStatus | None = None,
    current_agent: str | None = None,
    agent_name: str | None = None,
    agent_status: AgentStatus | None = None,
    error: str | None = None,
) -> None:
    project_dir = _get_project_dir(project_id)
    metadata_path = project_dir / "metadata.json"
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))

    if project_status is not None:
        metadata["status"] = project_status
    metadata["current_agent"] = current_agent
    if agent_name is not None and agent_status is not None:
        metadata.setdefault("agents", {})[agent_name] = agent_status
    if error is not None:
        metadata["error"] = error
    elif project_status in {ProjectStatus.RUNNING, ProjectStatus.COMPLETED}:
        metadata.pop("error", None)

    _write_json(metadata_path, metadata)


def save_planner_result(project_id: str, result: PlannerResult) -> None:
    project_dir = _get_project_dir(project_id)
    _write_json(
        project_dir / ".agent" / "planner.json",
        result.model_dump(mode="json"),
    )


def create_project_source_archive(project_id: str) -> Path:
    project_dir = _get_project_dir(project_id)
    source_dir = project_dir / "project"
    if not source_dir.is_dir():
        raise ProjectSourceNotFoundError(project_id)

    archive = tempfile.NamedTemporaryFile(
        prefix=f"project_{project_id}_",
        suffix=".zip",
        delete=False,
    )
    archive_path = Path(archive.name)
    archive.close()

    try:
        with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as zip_file:
            for path in sorted(source_dir.rglob("*")):
                if path.is_file():
                    zip_file.write(path, path.relative_to(source_dir))
    except Exception:
        archive_path.unlink(missing_ok=True)
        raise

    return archive_path

