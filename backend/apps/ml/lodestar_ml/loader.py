"""Loads dtcore.py and the pickled models from the mounted models directory (ML_MODELS_DIR, default /models).
dtcore.py is read from ML_DTCORE when set (a file mounted on its own), otherwise from the models directory.

Neither the code nor the models are part of the image: the directory is mounted read-only at run time. Each model
loads on its own; a missing or unreadable one leaves that model out (health reports "degraded") and its endpoint
answers 503, so callers fall back to their heuristics.
"""

from __future__ import annotations

import importlib
import logging
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

log = logging.getLogger("lodestar_ml")

TASK1_FILE = "task1_model.pkl"
TASK2A_FILE = "task2a_model.pkl"


@dataclass
class Models:
    models_dir: str
    dtcore_path: str | None = None
    dtcore: Any = None
    task1: Any = None
    task2a: Any = None
    errors: dict[str, str] = field(default_factory=dict)
    load_ms: int = 0

    @property
    def ok(self) -> bool:
        return self.task1 is not None and self.task2a is not None


def load_models(models_dir: str, dtcore_path: str | None = None, only: tuple[str, ...] = ("task1", "task2a")) -> Models:
    started = time.monotonic()
    out = Models(models_dir=models_dir, dtcore_path=dtcore_path)
    d = Path(models_dir)
    code = Path(dtcore_path) if dtcore_path else d / "dtcore.py"
    if not code.is_file():
        out.errors["dtcore"] = f"dtcore.py not found at {code}"
        log.warning(out.errors["dtcore"])
        return out
    try:
        if str(code.parent) not in sys.path:
            sys.path.insert(0, str(code.parent))
        # the models are instances of dtcore classes (Task1Model, RouteSimulator, DemandForecaster)
        out.dtcore = importlib.import_module("dtcore")
    except Exception as exc:  # noqa: BLE001 - any import failure means "no models", never a crash
        out.errors["dtcore"] = f"dtcore.py failed to import: {type(exc).__name__}: {exc}"
        log.warning(out.errors["dtcore"])
        return out

    import joblib

    # The final notebook defines dtcore's classes inline, so the pickles name them __main__.Task1Model,
    # __main__.RouteSimulator, ... (the notebook's `from dtcore import *`). Make those names resolve to dtcore.
    main = sys.modules["__main__"]
    for name in dir(out.dtcore):
        if not name.startswith("__") and not hasattr(main, name):
            setattr(main, name, getattr(out.dtcore, name))

    for attr, name in (("task1", TASK1_FILE), ("task2a", TASK2A_FILE)):
        if attr not in only:
            continue
        path = d / name
        if not path.is_file():
            out.errors[attr] = f"{name} not found in {models_dir}"
            log.warning(out.errors[attr])
            continue
        try:
            setattr(out, attr, joblib.load(path))
        except Exception as exc:  # noqa: BLE001
            out.errors[attr] = f"{name} failed to load: {type(exc).__name__}: {exc}"
            log.warning(out.errors[attr])
    out.load_ms = int((time.monotonic() - started) * 1000)
    return out
