# syntax=docker/dockerfile:1.7
# Lodestar ML: FastAPI serving the Adagard datathon models (Task 1 service time + late risk, Task 2A weekly demand).
# Build context: backend/apps/ml. The image holds NO model and NO datathon code: dtcore.py and the *.pkl files are
# mounted read-only at /models at run time (ML_MODELS_DIR). Without them /health says "degraded" and the
# endpoints answer 503, so every caller keeps its heuristics.

# ---------------------------------------------------------------- build stage
FROM python:3.13-slim AS build
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_DEFAULT_TIMEOUT=120 \
    PIP_RETRIES=20
RUN python -m venv /opt/venv
ENV PATH=/opt/venv/bin:$PATH
COPY requirements.txt /tmp/requirements.txt
RUN --mount=type=cache,target=/root/.cache/pip pip install -r /tmp/requirements.txt
# the pinned stack imports (fails the build on a broken wheel); lightgbm needs the OpenMP runtime
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 && rm -rf /var/lib/apt/lists/*
RUN python -c "import lightgbm, xgboost, sklearn, statsmodels, pandas, joblib, fastapi"
RUN python -m pip uninstall -y pip setuptools wheel || true

# ---------------------------------------------------------------- runtime stage
FROM python:3.13-slim AS runtime
# LightGBM links the system OpenMP runtime
RUN apt-get update \
 && apt-get install -y --no-install-recommends libgomp1 \
 && rm -rf /var/lib/apt/lists/*
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/opt/venv/bin:$PATH \
    OMP_NUM_THREADS=2 \
    LOKY_MAX_CPU_COUNT=2 \
    MPLCONFIGDIR=/tmp \
    ML_MODELS_DIR=/models
RUN groupadd --system --gid 10001 ml \
 && useradd --system --uid 10001 --gid ml --no-create-home --shell /usr/sbin/nologin ml
WORKDIR /app
COPY --from=build /opt/venv /opt/venv
COPY lodestar_ml ./lodestar_ml
USER 10001:10001
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=90s --retries=3 \
  CMD ["python", "-c", "import sys, urllib.request; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2).status == 200 else 1)"]
CMD ["uvicorn", "lodestar_ml.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-server-header", "--no-access-log", "--limit-concurrency", "16"]
