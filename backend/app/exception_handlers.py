import logging

import httpx
from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from app.schema.response import error_response


logger = logging.getLogger(__name__)


def _error_json_response(
    *,
    status_code: int,
    message: str,
    code: str,
    details: object | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    safe_details = jsonable_encoder(
        details,
        custom_encoder={ValueError: str},
    )
    body = error_response(
        message=message,
        code=code,
        details=safe_details,
        status_code=status_code,
    )
    return JSONResponse(
        status_code=status_code,
        content=body.model_dump(mode="json"),
        headers=headers,
    )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        return _error_json_response(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            message="Request validation failed",
            code="VALIDATION_ERROR",
            details=[
                {
                    "type": error["type"],
                    "location": error["loc"],
                    "message": error["msg"],
                }
                for error in exc.errors()
            ],
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(
        request: Request,
        exc: HTTPException,
    ) -> JSONResponse:
        message = exc.detail if isinstance(exc.detail, str) else "Request failed"
        details = None if isinstance(exc.detail, str) else exc.detail
        return _error_json_response(
            status_code=exc.status_code,
            message=message,
            code="HTTP_ERROR",
            details=details,
            headers=exc.headers,
        )

    @app.exception_handler(httpx.TimeoutException)
    async def upstream_timeout_handler(
        request: Request,
        exc: httpx.TimeoutException,
    ) -> JSONResponse:
        return _error_json_response(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            message="The LLM service timed out",
            code="LLM_TIMEOUT",
        )

    @app.exception_handler(httpx.HTTPStatusError)
    async def upstream_status_handler(
        request: Request,
        exc: httpx.HTTPStatusError,
    ) -> JSONResponse:
        return _error_json_response(
            status_code=status.HTTP_502_BAD_GATEWAY,
            message="The LLM service returned an error",
            code="LLM_UPSTREAM_ERROR",
            details={"upstream_status": exc.response.status_code},
        )

    @app.exception_handler(httpx.RequestError)
    async def upstream_connection_handler(
        request: Request,
        exc: httpx.RequestError,
    ) -> JSONResponse:
        return _error_json_response(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            message="The LLM service is unavailable",
            code="LLM_UNAVAILABLE",
        )

    @app.exception_handler(Exception)
    async def unexpected_exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        logger.exception(
            "Unhandled error while processing %s %s",
            request.method,
            request.url.path,
            exc_info=exc,
        )
        return _error_json_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message="An unexpected error occurred",
            code="INTERNAL_SERVER_ERROR",
        )

