"""ASGI entry point: ``uvicorn lodestar_ocr.main:app``. The model loads in the lifespan handler."""

from .app import create_app

app = create_app()
