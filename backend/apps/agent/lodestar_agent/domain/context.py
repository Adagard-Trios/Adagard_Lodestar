"""Indexed view over the raw OData rows a run loaded."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any

from . import heuristics as h

# DEFERRED: an order an earlier run deferred and rolled to this day (executePlan sets deferredYesterday, so it is
# protected here); leaving it out would strand it, unplanned, on its new run date.
OPEN_STATUSES = ("RECEIVED", "PLANNED", "DEFERRED")


@dataclass
class PlanningContext:
    depot: str
    run_date: str
    orders: dict[str, dict[str, Any]]
    outlets: dict[str, dict[str, Any]]
    vehicles: dict[str, dict[str, Any]]
    travel: dict[str, dict[str, Any]]
    allowances: dict[tuple[str, str], int]
    calendar: dict[str, dict[str, Any]]
    first_departure: str = "03:30"
    scores: dict[str, int] = field(default_factory=dict)
    protected: dict[str, bool] = field(default_factory=dict)

    # ------------------------------------------------------------ construction
    @classmethod
    def from_raw(cls, raw: dict[str, list[dict[str, Any]]], depot: str, run_date: str, first_departure: str = "03:30") -> PlanningContext:
        outlets = {o["id"]: o for o in raw.get("outlets", []) if o.get("depot", depot) == depot and o.get("isActive", True)}
        orders = {
            o["id"]: o
            for o in raw.get("orders", [])
            if o.get("outletId") in outlets and o.get("status", "RECEIVED") in OPEN_STATUSES
        }
        vehicles = {v["id"]: v for v in raw.get("vehicles", []) if v.get("depot", depot) == depot}
        travel = {t["district"]: t for t in raw.get("districtTravel", []) if t.get("depot", depot) == depot}
        allowances = {(a["brand"], a["dockType"]): int(a["minutes"]) for a in raw.get("serviceAllowances", [])}
        calendar = {str(c["date"])[:10]: c for c in raw.get("calendar", [])}
        ctx = cls(depot, run_date, orders, outlets, vehicles, travel, allowances, calendar, first_departure)
        ctx._score_orders()
        return ctx

    def _score_orders(self) -> None:
        nxt = self.next_run_within_24h()
        for oid, order in self.orders.items():
            outlet = self.outlets[order["outletId"]]
            score = h.order_score(order, outlet, nxt)
            self.scores[oid] = score
            self.protected[oid] = h.order_is_protected(order, outlet, score)

    # ------------------------------------------------------------ calendar
    def day(self, iso: str) -> dict[str, Any]:
        return self.calendar.get(iso, {})

    def is_operating(self) -> bool:
        return bool(self.day(self.run_date).get("isOperating", True))

    def is_monsoon(self) -> bool:
        return bool(self.day(self.run_date).get("monsoon", 0))

    def next_run_within_24h(self) -> bool:
        nxt = (date.fromisoformat(self.run_date) + timedelta(days=1)).isoformat()
        return bool(self.day(nxt).get("isOperating", False))

    # ------------------------------------------------------------ lookups
    def outlet_of(self, order_id: str) -> dict[str, Any]:
        return self.outlets[self.orders[order_id]["outletId"]]

    def district_of(self, order_id: str) -> str:
        return str(self.outlet_of(order_id).get("district"))

    def brand_of(self, order_id: str) -> str:
        return str(self.orders[order_id].get("brand") or self.outlet_of(order_id).get("brand"))

    def needs_reefer(self, order_id: str) -> bool:
        return self.orders[order_id].get("tempClass") == "CHILLED"

    def needs_van(self, order_id: str) -> bool:
        return self.outlet_of(order_id).get("parking") == "VAN_ONLY"

    def is_mall(self, order_id: str) -> bool:
        outlet = self.outlet_of(order_id)
        return outlet.get("parking") == "MALL_DOCK" or outlet.get("dockType") == "MALL_BAY"

    def window_of(self, order_id: str) -> tuple[str, str]:
        """(open, close) of an order's delivery: a mall's delivery window (``mallWindow`` "HH:mm-HH:mm")
        narrows the store hours."""
        outlet = self.outlet_of(order_id)
        opens, closes = str(outlet.get("windowOpen") or "00:00"), str(outlet.get("windowClose") or "24:00")
        mall = str(outlet.get("mallWindow") or "")
        if self.is_mall(order_id) and "-" in mall:
            m_open, m_close = (x.strip() for x in mall.split("-", 1))
            opens = max(opens, m_open, key=h.to_min)
            closes = min(closes, m_close, key=h.to_min)
        return opens, closes

    def travel_for(self, district: str) -> dict[str, Any]:
        return self.travel.get(district, {"district": district, "depotToDistMin": 60, "interStopMin": 15, "roadClass": "suburban"})

    def service_min(self, order_id: str) -> int:
        outlet = self.outlet_of(order_id)
        return h.service_minutes(self.allowances, self.brand_of(order_id), str(outlet.get("dockType")))

    def available_vehicles(self) -> list[dict[str, Any]]:
        return [v for _, v in sorted(self.vehicles.items()) if v.get("status", "AVAILABLE") == "AVAILABLE"]

    def summary(self) -> dict[str, Any]:
        down = sorted(v["id"] for v in self.vehicles.values() if v.get("status", "AVAILABLE") != "AVAILABLE")
        return {
            "orders": len(self.orders),
            "outlets": len(self.outlets),
            "vehicles": len(self.vehicles),
            "vehiclesDown": down,
            "chilledDemand": h.chilled_demand(self.orders.values()),
            "reeferCapacity": h.reefer_capacity(self.vehicles.values()),
            "operating": self.is_operating(),
            "monsoon": self.is_monsoon(),
        }
