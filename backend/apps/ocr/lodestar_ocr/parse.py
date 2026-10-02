"""The best value for what the camera was pointed at. The person always confirms it on the phone."""

from __future__ import annotations

import re
from typing import Literal

Kind = Literal["temperature", "seal", "label", "code", "text"]
Line = tuple[str, float]  # (text, confidence)

# 3.5°C, -18 C, +4.0℃, 38°F, "TEMP 2,5" ; OCR often reads "°" as "o", "º" or drops it
_TEMP = re.compile(r"(?<![\w.])([-+−–]?\s?\d{1,2}(?:[.,]\d{1,2})?)\s*(°|º|˚|o(?=\s*[CF])|℃|℉)?\s*([CF])?(?![\w])", re.I)
# seal / label / code tokens: letters, digits and the separators printed on seals (SL-004512, A12 345)
_TOKEN = re.compile(r"[A-Z0-9][A-Z0-9\-/]{2,}[A-Z0-9]")


def _num(raw: str) -> str:
    s = raw.replace(" ", "").replace("−", "-").replace("–", "-").replace(",", ".").lstrip("+")
    return s


def temperature(lines: list[Line]) -> tuple[str | None, float]:
    """A reefer / probe reading in °C (°F converted), the most temperature-like number on the photo."""
    best: tuple[int, str, float] | None = None
    for text, conf in lines:
        for m in _TEMP.finditer(text):
            value, degree, unit = _num(m.group(1)), m.group(2), (m.group(3) or "").upper()
            if degree in ("℃",):
                unit = "C"
            elif degree in ("℉",):
                unit = "F"
            try:
                v = float(value)
            except ValueError:
                continue
            if unit == "F":
                v = round((v - 32) * 5 / 9, 1)
                value = f"{v:g}"
            if not -40 <= v <= 60:
                continue
            # a degree sign or a unit beats a bare number; a decimal beats an integer (a display shows 3.5, not a stop number)
            score = (4 if degree else 0) + (3 if unit else 0) + (1 if "." in value else 0)
            if best is None or score > best[0]:
                best = (score, value, conf)
    return (best[1], best[2]) if best else (None, 0.0)


def _code(lines: list[Line], min_digits: int, min_len: int) -> tuple[str | None, float]:
    best: tuple[tuple[int, int], str, float] | None = None
    for text, conf in lines:
        joined = text.upper()
        # "SL 004512" is one seal number printed with a space
        candidates = set(_TOKEN.findall(joined)) | set(_TOKEN.findall(re.sub(r"(?<=[A-Z0-9])\s(?=[0-9])", "", joined)))
        for tok in candidates:
            digits = sum(c.isdigit() for c in tok)
            if digits < min_digits or len(tok) < min_len:
                continue
            key = (digits, len(tok))
            if best is None or key > best[0]:
                best = (key, tok, conf)
    return (best[1], best[2]) if best else (None, 0.0)


def best_value(kind: Kind, lines: list[Line]) -> tuple[str | None, float]:
    """(value, its confidence) for the kind, or (None, 0) when nothing fits: the phone asks the person to type it."""
    if kind == "temperature":
        return temperature(lines)
    if kind == "seal":
        return _code(lines, min_digits=3, min_len=4)
    if kind in ("label", "code"):
        return _code(lines, min_digits=4, min_len=4)
    text = " ".join(t for t, _ in lines).strip()
    if not text:
        return None, 0.0
    return text, (sum(c for _, c in lines) / len(lines))
