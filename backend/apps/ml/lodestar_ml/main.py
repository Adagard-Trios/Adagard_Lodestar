"""ASGI entry point: ``uvicorn lodestar_ml.main:app``. The models load in the lifespan handler."""

from .app import create_app

app = create_app()
