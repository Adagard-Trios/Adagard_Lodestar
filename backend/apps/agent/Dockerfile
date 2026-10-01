# syntax=docker/dockerfile:1.7
# Lodestar planning agent (FastAPI + LangGraph). Build context: backend/apps/agent

# ---------------------------------------------------------------- build stage
FROM python:3.12-slim AS build
ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
RUN python -m venv /opt/venv
ENV PATH=/opt/venv/bin:$PATH
COPY requirements.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt
# no installer in the runtime venv
RUN python -m pip uninstall -y pip setuptools wheel || true

# ---------------------------------------------------------------- runtime stage
FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/opt/venv/bin:$PATH \
    AGENT_MODEL=mock
RUN groupadd --system --gid 10001 agent \
 && useradd --system --uid 10001 --gid agent --no-create-home --shell /usr/sbin/nologin agent
WORKDIR /app
COPY --from=build /opt/venv /opt/venv
COPY lodestar_agent ./lodestar_agent
USER 10001:10001
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD ["python", "-c", "import sys, urllib.request; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2).status == 200 else 1)"]
CMD ["uvicorn", "lodestar_agent.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-server-header", "--no-access-log"]
