"""RapidOCR (PaddleOCR PP-OCRv4 mobile det/rec + mobile cls on ONNX Runtime), CPU only.

The three ONNX models ship inside the rapidocr-onnxruntime wheel, so they are in the image from build time;
nothing is downloaded at runtime. One engine, one inference at a time (bounded RAM on a small VM).
"""

from __future__ import annotations

import io
import threading
from typing import Protocol

import numpy as np
from PIL import Image, ImageOps

# a phone photo is downscaled before detection: enough for a seal or a display, small enough for 300 MB
MAX_SIDE = 1280


class Engine(Protocol):
    def read(self, image: Image.Image) -> list[tuple[str, float]]: ...


def decode(data: bytes) -> Image.Image:
    """JPEG/PNG bytes → upright RGB image no larger than MAX_SIDE. ValueError when it is not one."""
    try:
        img = Image.open(io.BytesIO(data))
        if img.format not in ("JPEG", "PNG"):
            raise ValueError(f"unsupported image format {img.format}")
        img = ImageOps.exif_transpose(img).convert("RGB")  # phones store portrait photos rotated + an EXIF flag
    except ValueError:
        raise
    except Exception as exc:  # Pillow raises several types for a broken file
        raise ValueError("not a JPEG or PNG image") from exc
    img.thumbnail((MAX_SIDE, MAX_SIDE))
    return img


class RapidEngine:
    def __init__(self, threads: int = 2):
        from rapidocr_onnxruntime import RapidOCR  # heavy import: only in the real service

        self._ocr = RapidOCR(intra_op_num_threads=threads, inter_op_num_threads=1, max_side_len=MAX_SIDE)
        self._lock = threading.Lock()

    def read(self, image: Image.Image) -> list[tuple[str, float]]:
        bgr = np.ascontiguousarray(np.asarray(image)[:, :, ::-1])
        with self._lock:
            result, _ = self._ocr(bgr)
        if not result:
            return []
        # top-to-bottom, left-to-right, as a person reads the label
        rows = sorted(result, key=lambda r: (round(min(p[1] for p in r[0]) / 20), min(p[0] for p in r[0])))
        return [(str(text).strip(), float(score)) for _, text, score in rows if str(text).strip()]
