from abc import ABC, abstractmethod
from collections.abc import Sequence
from typing import Any, Generic, TypeVar

from app.llm.provider import LLMProvider
from app.schema.agent import AgentInput, AgentOutput


InputT = TypeVar("InputT")
OutputT = TypeVar("OutputT")


class BaseAgent(ABC, Generic[InputT, OutputT]):
    """Common asynchronous contract implemented by every workflow agent."""

    name: str
    role: str
    system_prompt: str

    def __init__(
        self,
        llm: LLMProvider | None = None,
        tools: Sequence[Any] | None = None,
    ) -> None:
        self.llm = llm or LLMProvider()
        self.tools = tuple(tools or ())

    @abstractmethod
    async def run(self, agent_input: AgentInput[InputT]) -> AgentOutput[OutputT]:
        """Process typed input and return a typed agent result."""
        raise NotImplementedError
