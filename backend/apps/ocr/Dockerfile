# syntax=docker/dockerfile:1.7
# Lodestar OCR ("Read from photo · confirm"): FastAPI + RapidOCR (PP-OCRv4 mobile on ONNX Runtime), CPU only.
# Build context: backend/apps/ocr. The ONNX models ship in the rapidocr wheel: they are in the image, never downloaded at runtime.

# ---------------------------------------------------------------- build stage
FROM python:3.12-slim AS build
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_DEFAULT_TIMEOUT=120 \
    PIP_RETRIES=20
RUN python -m venv /opt/venv
ENV PATH=/opt/venv/bin:$PATH
COPY requirements.txt /tmp/requirements.txt
# rapidocr without its own dependencies: they are pinned in requirements.txt with headless OpenCV (no libGL)
RUN --mount=type=cache,target=/root/.cache/pip \
    grep -v '^rapidocr' /tmp/requirements.txt > /tmp/deps.txt \
 && pip install -r /tmp/deps.txt \
 && pip install --no-deps $(grep '^rapidocr' /tmp/requirements.txt)
# the models load and run once at build time (fails the build if one is missing)
RUN python -c "import numpy as np; from rapidocr_onnxruntime import RapidOCR; RapidOCR()(np.full((64, 256, 3), 255, np.uint8))"
RUN python -m pip uninstall -y pip setuptools wheel || true

# ---------------------------------------------------------------- runtime stage
FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/opt/venv/bin:$PATH \
    OMP_NUM_THREADS=2 \
    OCR_THREADS=2
RUN groupadd --system --gid 10001 ocr \
 && useradd --system --uid 10001 --gid ocr --no-create-home --shell /usr/sbin/nologin ocr
WORKDIR /app
COPY --from=build /opt/venv /opt/venv
COPY lodestar_ocr ./lodestar_ocr
USER 10001:10001
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD ["python", "-c", "import sys, urllib.request; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2).status == 200 else 1)"]
CMD ["uvicorn", "lodestar_ocr.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-server-header", "--no-access-log", "--limit-concurrency", "16"]
