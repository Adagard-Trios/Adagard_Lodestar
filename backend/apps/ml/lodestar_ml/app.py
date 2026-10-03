"""Lodestar ML: GET /health, POST /predict/stops, POST /forecast/weeks.

Internal only: the service sits on the compose `app` network (no route out, not behind the gateway) and is
called by the planning agent, trips and planning services, which fall back to their heuristics whenever it is
slow, down or answers anything but 200. It holds no data and writes nothing, so it takes no token.
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse

from .demand import Computing
from .loader import Models, load_models
from .schemas import ForecastWeeksRequest, ForecastWeeksResponse, PredictStopsRequest, PredictStopsResponse
from .stops import StopPredictor, UnsupportedInput

log = logging.getLogger("lodestar_ml")

DEFAULT_MODELS_DIR = "/models"


def forecast_wait_s() -> float:
    """How long a forecast request waits for a forecast that is not cached yet (it keeps computing after)."""
    return float(os.getenv("ML_FORECAST_WAIT_S", "1.5"))


def _build(app: FastAPI, models: Models) -> None:
    app.state.models = models
    app.state.stops = None
    app.state.demand = None
    if models.task1 is not None:
        try:
            app.state.stops = StopPredictor(models.task1, models.dtcore)
        except Exception as exc:  # noqa: BLE001
            models.errors["task1"] = f"task1 model unusable: {type(exc).__name__}: {exc}"
            log.warning(models.errors["task1"])
    if models.task2a is not None:
        try:
            from .demand import DemandPredictor

            app.state.demand = DemandPredictor(models.task2a, models.dtcore)
        except Exception as exc:  # noqa: BLE001
            models.errors["task2a"] = f"task2a model unusable: {type(exc).__name__}: {exc}"
            log.warning(models.errors["task2a"])


def create_app(models: Models | None = None) -> FastAPI:
    logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format='{"level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}')

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        if not hasattr(app.state, "models"):
            loaded = await run_in_threadpool(load_models, os.getenv("ML_MODELS_DIR", DEFAULT_MODELS_DIR), os.getenv("ML_DTCORE") or None)
            _build(app, loaded)
            log.info("models loaded: task1=%s task2a=%s in %d ms", app.state.stops is not None, app.state.demand is not None, loaded.load_ms)
        app.state.slots = asyncio.Semaphore(int(os.getenv("ML_CONCURRENCY", "2")))
        yield

    app = FastAPI(title="Lodestar ML", docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)
    if models is not None:
        _build(app, models)

    @app.get("/health")
    async def health(request: Request):
        st = request.app.state
        task1, task2a = getattr(st, "stops", None) is not None, getattr(st, "demand", None) is not None
        models: Models | None = getattr(st, "models", None)
        body = {
            "status": "ok" if task1 and task2a else "degraded",
            "models": {"task1": task1, "task2a": task2a},
            "errors": models.errors if models else {},
        }
        if task2a:
            body["demandHistoryEnd"] = st.demand.history_end.isoformat()
        # 200 even when degraded: the process is healthy, callers read `models` and fall back on 503s
        return body

    async def _run(request: Request, fn, *args):
        slots: asyncio.Semaphore = getattr(request.app.state, "slots", None) or asyncio.Semaphore(2)
        async with slots:
            try:
                return await run_in_threadpool(fn, *args)
            except UnsupportedInput as exc:
                raise HTTPException(422, detail=str(exc)) from exc
            except Computing as exc:
                raise HTTPException(503, detail=str(exc), headers={"Retry-After": "30"}) from exc
            except Exception as exc:  # noqa: BLE001 - never leak a traceback; the caller falls back
                log.exception("prediction failed")
                raise HTTPException(500, detail=f"prediction failed: {type(exc).__name__}") from exc

    @app.post("/predict/stops", response_model=PredictStopsResponse)
    async def predict_stops(body: PredictStopsRequest, request: Request):
        predictor: StopPredictor | None = getattr(request.app.state, "stops", None)
        if predictor is None:
            raise HTTPException(503, detail="task1 model not loaded")
        started = time.monotonic()
        preds = await _run(request, predictor.predict, body.stops)
        return {"model": "task1", "predictions": preds, "ms": int((time.monotonic() - started) * 1000)}

    @app.post("/forecast/weeks", response_model=ForecastWeeksResponse)
    async def forecast_weeks(body: ForecastWeeksRequest, request: Request):
        predictor = getattr(request.app.state, "demand", None)
        if predictor is None:
            raise HTTPException(503, detail="task2a model not loaded")
        started = time.monotonic()
        weeks = await _run(request, predictor.forecast, body.weeks, body.calendar, forecast_wait_s())
        return {
            "model": "task2a", "historyEnd": predictor.history_end.isoformat(), "weeks": weeks,
            "ms": int((time.monotonic() - started) * 1000),
        }

    @app.exception_handler(HTTPException)
    async def http_error(_request: Request, exc: HTTPException):
        return JSONResponse({"error": {"code": exc.status_code, "message": exc.detail}}, status_code=exc.status_code, headers=exc.headers)

    return app
