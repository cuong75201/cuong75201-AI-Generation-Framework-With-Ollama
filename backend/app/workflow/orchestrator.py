from collections.abc import Sequence
from typing import Any

from app.agents.base_agent import BaseAgent
from app.schema.agent import AgentInput, AgentOutput, AgentStatus
from app.schema.planner import PlannerResult
from app.schema.project import ProjectStatus
from app.workspace.manager import save_planner_result, update_project_progress


class WorkflowExecutionError(RuntimeError):
    def __init__(self, result: AgentOutput[Any]) -> None:
        super().__init__(result.error or f"Agent '{result.agent}' failed")
        self.result = result


class WorkflowOrchestrator:
    """Runs agents sequentially and passes structured output to the next agent."""

    def __init__(self, agents: Sequence[BaseAgent[Any, Any]]) -> None:
        if not agents:
            raise ValueError("Workflow requires at least one agent")
        self.agents = tuple(agents)

    async def run(self, initial_input: AgentInput[Any]) -> list[AgentOutput[Any]]:
        current_input = initial_input
        results: list[AgentOutput[Any]] = []
        active_agent: str | None = None

        update_project_progress(
            initial_input.project_id,
            project_status=ProjectStatus.RUNNING,
        )

        try:
            for agent in self.agents:
                active_agent = agent.name
                update_project_progress(
                    initial_input.project_id,
                    project_status=ProjectStatus.RUNNING,
                    current_agent=agent.name,
                    agent_name=agent.name,
                    agent_status=AgentStatus.RUNNING,
                )

                result = await agent.run(current_input)
                results.append(result)
                update_project_progress(
                    initial_input.project_id,
                    current_agent=None,
                    agent_name=agent.name,
                    agent_status=result.status,
                    error=result.error,
                )

                if result.status == AgentStatus.FAILED:
                    raise WorkflowExecutionError(result)
                if result.status != AgentStatus.COMPLETED:
                    raise ValueError(
                        f"Agent '{result.agent}' returned non-terminal status '{result.status}'"
                    )
                if agent.name == "planner" and isinstance(result.data, PlannerResult):
                    save_planner_result(initial_input.project_id, result.data)

                current_input = AgentInput(
                    project_id=initial_input.project_id,
                    data=result.data,
                )

            update_project_progress(
                initial_input.project_id,
                project_status=ProjectStatus.COMPLETED,
                current_agent=None,
            )
            return results
        except Exception as exc:
            update_project_progress(
                initial_input.project_id,
                project_status=ProjectStatus.FAILED,
                current_agent=None,
                agent_name=active_agent,
                agent_status=AgentStatus.FAILED if active_agent else None,
                error=str(exc),
            )
            raise
