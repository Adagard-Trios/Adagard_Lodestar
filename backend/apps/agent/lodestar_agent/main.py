"""ASGI entry point: ``uvicorn lodestar_agent.main:app``.

Importing this module builds the app but does not connect anywhere; the
checkpointer, model and HTTP clients are created in the lifespan handler.
"""

from .app import create_app

app = create_app()
