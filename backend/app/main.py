


from fastapi import FastAPI

from app.exception_handlers import register_exception_handlers
from app.llm.provider import LLMProvider
from app.router.projects import router as projects_router
from app.schema.request import ChatRequest
from app.schema.response import ApiResponse, success_response


app = FastAPI(title="AI Content Generation API")
register_exception_handlers(app)
app.include_router(projects_router)


@app.post("/api/chat", response_model=ApiResponse[str])
async def chat(body: ChatRequest) -> ApiResponse[str]:
    llm = LLMProvider()
    result = await llm.chat(
        system_prompt="Bạn là trợ lý lập trình.",
        user_prompt=body.message,
    )
    return success_response(data=result)
