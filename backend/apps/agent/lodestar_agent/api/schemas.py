"""Request/response models (pydantic v2)."""

from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

ID_PATTERN = r"^[A-Za-z0-9][A-Za-z0-9_\-]{0,63}$"


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class StartRunRequest(StrictModel):
    depot: str = Field(pattern=r"^[A-Za-z_]{2,32}$")
    runDate: date

    @field_validator("depot")
    @classmethod
    def _upper(cls, v: str) -> str:
        return v.upper()


class Edit(StrictModel):
    op: Literal["move", "defer"]
    orderId: str = Field(pattern=ID_PATTERN)
    vehicleId: str | None = Field(default=None, pattern=ID_PATTERN)
    tripNo: int | None = Field(default=None, ge=1, le=2)
    reason: Literal["CAP_REEFER", "CAP_TIME", "ACCESS", "WINDOW", "FUEL", "VEH_DOWN"] | None = None

    @model_validator(mode="after")
    def _shape(self) -> Edit:
        if self.op == "move" and not self.vehicleId:
            raise ValueError("a 'move' edit needs vehicleId")
        if self.op == "defer" and not self.reason:
            raise ValueError("a 'defer' edit needs a reason code")
        return self


class ResumeRequest(StrictModel):
    decision: Literal["approve", "edit", "reject"]
    edits: list[Edit] | None = Field(default=None, max_length=50)
    comment: str | None = Field(default=None, max_length=500)


class AskRequest(StrictModel):
    runId: str = Field(pattern=r"^[A-Za-z0-9_\-]{1,80}$")
    question: str = Field(min_length=1, max_length=1000)


class StartRunResponse(BaseModel):
    id: str
    status: str
    version: int | None = None
