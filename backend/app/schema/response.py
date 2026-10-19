from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiError(BaseModel):
    code: str
    details: Any | None = None


class ApiResponse(BaseModel, Generic[T]):
    status: bool
    status_code: int
    message: str
    data: T | None
    error: ApiError | None = None


def success_response(
    data: T | None = None,
    message: str = "Success",
    status_code: int = 200,
) -> ApiResponse[T]:
    return ApiResponse(
        status=True,
        status_code=status_code,
        message=message,
        data=data,
        error=None,
    )


def error_response(
    message: str,
    code: str = "REQUEST_FAILED",
    details: Any | None = None,
    status_code: int = 400,
) -> ApiResponse[None]:
    return ApiResponse(
        status=False,
        status_code=status_code,
        message=message,
        data=None,
        error=ApiError(code=code, details=details),
    )
