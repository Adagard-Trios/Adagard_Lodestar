"""POST /read: a photo in, the text on it and the best value for the kind out ("Read from photo · confirm")."""

from __future__ import annotations

import asyncio
import base64
import binascii
import logging
import os
import time
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .auth import Principal, TokenVerifier, field_user
from .engine import Engine, decode
from .parse import Kind, best_value

log = logging.getLogger("lodestar_ocr")

MAX_IMAGE_BYTES = 2 * 1024 * 1024
TIMEOUT_S = float(os.getenv("OCR_TIMEOUT_S", "10"))


class ReadRequest(BaseModel):
    # base64 of ≤ 2 MB, optionally as a data: URL
    image: str = Field(min_length=8, max_length=2_900_000)
    kind: Kind = "text"


class LineOut(BaseModel):
    text: str
    confidence: float


class ReadResponse(BaseModel):
    text: str
    lines: list[LineOut]
    value: str | None
    confidence: float
    ms: int


def _bytes(image: str) -> bytes:
    raw = image.split(",", 1)[1] if image.startswith("data:") else image
    try:
        data = base64.b64decode(raw, validate=False)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(400, detail="image is not base64") from exc
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(413, detail="image larger than 2 MB")
    return data


def create_app(verifier: TokenVerifier | None = None, engine: Engine | None = None) -> FastAPI:
    logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format='{"level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}')

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        if not hasattr(app.state, "verifier"):
            app.state.verifier = TokenVerifier(
                issuer=os.environ["OIDC_ISSUER"],
                audience=os.getenv("OIDC_AUDIENCE", "lodestar-api"),
                jwks_url=os.environ["OIDC_JWKS_URL"],
            )
        if not hasattr(app.state, "engine"):
            from .engine import RapidEngine

            app.state.engine = await run_in_threadpool(RapidEngine, int(os.getenv("OCR_THREADS", "2")))
        app.state.slots = asyncio.Semaphore(1)
        yield

    app = FastAPI(title="Lodestar OCR", docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)
    if verifier is not None:
        app.state.verifier = verifier
    if engine is not None:
        app.state.engine = engine

    @app.get("/health")
    def health(request: Request):
        return {"status": "ok", "model": "PP-OCRv4 mobile (onnxruntime, cpu)", "ready": hasattr(request.app.state, "engine")}

    @app.post("/read", response_model=ReadResponse)
    async def read(body: ReadRequest, request: Request, principal: Principal = Depends(field_user)):
        started = time.perf_counter()
        data = _bytes(body.image)
        try:
            image = decode(data)
        except ValueError as exc:
            raise HTTPException(415, detail=str(exc)) from exc
        state = request.app.state

        async def run():
            async with state.slots:  # one photo at a time; queued photos count against the same 10 s
                return await run_in_threadpool(state.engine.read, image)

        try:
            lines = await asyncio.wait_for(run(), timeout=TIMEOUT_S)
        except TimeoutError:
            log.warning("read timed out kind=%s", body.kind)
            return JSONResponse({"detail": "reading took too long"}, status_code=504)
        value, conf = best_value(body.kind, lines)
        ms = int((time.perf_counter() - started) * 1000)
        log.info("read kind=%s lines=%d found=%s ms=%d", body.kind, len(lines), value is not None, ms)
        return ReadResponse(
            text="\n".join(t for t, _ in lines),
            lines=[LineOut(text=t, confidence=round(c, 3)) for t, c in lines],
            value=value,
            confidence=round(conf, 3),
            ms=ms,
        )

    return app
