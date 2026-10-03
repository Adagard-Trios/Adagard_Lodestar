"""Request and response bodies. Field names are Lodestar's (camelCase); stops.py and demand.py map them to the
columns dtcore's feature builders read (task1 inputs, route legs, outlets, vehicles, district travel, service
allowance, calendar, road conditions; task2a inputs and the daily calendar)."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

HHMM = r"^\d{2}:\d{2}$"
DAY = r"^\d{4}-\d{2}-\d{2}$"
MAX_STOPS = 2000


class _In(BaseModel):
    model_config = ConfigDict(extra="ignore")


class StopIn(_In):
    """One planned stop: the order, its outlet, the vehicle, the leg that reaches it and the day."""

    stopId: str = Field(min_length=1, max_length=64)
    # a trip; stops of one route are scored together (route totals, accumulated delay, the simulator)
    routeId: str = Field(min_length=1, max_length=64)
    seq: int = Field(ge=0, le=200)  # 0 = first stop after the depot
    date: str = Field(pattern=DAY)  # run date
    orderDate: str | None = Field(default=None, pattern=DAY)
    deferred: bool = False
    # outlet
    outletId: str = Field(min_length=1, max_length=32)
    brand: str
    district: str
    depot: str
    dockType: str
    parking: str
    mallWindow: str | None = None
    windowOpen: str = Field(pattern=HHMM)
    windowClose: str = Field(pattern=HHMM)
    # order
    tempRequirement: str = "AMBIENT"  # CHILLED | AMBIENT
    units: float = Field(ge=0)
    kg: float = Field(ge=0)
    m3: float = Field(ge=0)
    # vehicle
    vehicleId: str = Field(min_length=1, max_length=32)
    vehicleType: str  # VAN | TRUCK
    vehicleTemp: str  # CHILLED (reefer) | AMBIENT
    capacityKg: float = Field(gt=0)
    capacityM3: float = Field(gt=0)
    kmPerLitre: float | None = None
    weeklyFuelL: float | None = None
    # the leg to this stop (planned, clock times in Colombo HH:MM)
    plannedDepart: str = Field(pattern=HHMM)
    plannedArrive: str = Field(pattern=HHMM)
    plannedTravelMin: float = Field(ge=0)
    distanceKm: float | None = Field(default=None, ge=0)
    # district travel
    roadClass: str | None = None
    depotToDistrictKm: float | None = None
    depotToDistrictMin: float | None = None
    interStopKm: float | None = None
    interStopMin: float | None = None
    freeFlowKmh: float | None = None
    serviceAllowanceMin: float = Field(gt=0)
    # calendar and road conditions of the run date
    monsoon: int = Field(default=0, ge=0, le=1)
    isPayday: bool = False
    isHoliday: bool = False
    festivalRamp: float = 0.0
    disruptionIndex: float | None = Field(default=None, gt=0)


class PredictStopsRequest(_In):
    stops: list[StopIn] = Field(min_length=1, max_length=MAX_STOPS)


class StopOut(BaseModel):
    stopId: str
    serviceMin: float  # predicted minutes at the stop
    lateProb: float  # P(arrival after the window closes)
    etaMin: float | None  # simulated median arrival, minutes after midnight
    etaP90Min: float | None


class PredictStopsResponse(BaseModel):
    model: str = "task1"
    predictions: list[StopOut]
    ms: int


class WeekIn(_In):
    depot: str
    brand: str
    isoYear: int = Field(ge=2024, le=2100)
    isoWeek: int = Field(ge=1, le=53)


class CalendarDayIn(_In):
    date: str = Field(pattern=DAY)
    isOperating: bool = True
    isPayday: bool = False
    isHoliday: bool = False
    festivalRamp: float = 0.0
    festivalName: str | None = None
    monsoon: int = Field(default=0, ge=0, le=1)


class ForecastWeeksRequest(_In):
    weeks: list[WeekIn] = Field(min_length=1, max_length=200)
    # daily calendar for the weeks asked (and around them); a week without all seven days falls back to the same
    # ISO week of the last year in the model's history
    calendar: list[CalendarDayIn] = Field(default_factory=list, max_length=1200)


class WeekOut(BaseModel):
    depot: str
    brand: str
    isoYear: int
    isoWeek: int
    weekStart: str
    horizon: int  # weeks after the last week of the model's history
    totalM3: float
    chilledM3: float
    calendarFrom: str  # "request" | "history"


class ForecastWeeksResponse(BaseModel):
    model: str = "task2a"
    historyEnd: str
    weeks: list[WeekOut]
    ms: int
