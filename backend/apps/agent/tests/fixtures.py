"""Small synthetic planning data. Nothing here comes from the competition datasets."""

from __future__ import annotations

import copy
from typing import Any

DEPOT = "NORTH"
OTHER_DEPOT = "SOUTH"
RUN_DATE = "2030-01-08"
NEXT_DATE = "2030-01-09"


def outlet(oid: str, brand: str, district: str, dock: str, parking: str, open_: str, close: str, **extra: Any) -> dict[str, Any]:
    return {
        "id": oid,
        "name": f"Synthetic {oid}",
        "brand": brand,
        "district": district,
        "depot": DEPOT,
        "dockType": dock,
        "parking": parking,
        "windowOpen": open_,
        "windowClose": close,
        "isActive": True,
        **extra,
    }


def vehicle(vid: str, vtype: str, temp: str, kg: float, m3: float, kmpl: float, quota: int, used: int, status: str = "AVAILABLE") -> dict[str, Any]:
    return {
        "id": vid,
        "depot": DEPOT,
        "type": vtype,
        "tempClass": temp,
        "capacityKg": kg,
        "capacityM3": m3,
        "kmPerLitre": kmpl,
        "weeklyLFuel": quota,
        "usedLThisWeek": used,
        "status": status,
    }


def order(oid: str, outlet_id: str, brand: str, temp: str, kg: float, m3: float, **extra: Any) -> dict[str, Any]:
    return {
        "id": oid,
        "outletId": outlet_id,
        "runDate": f"{RUN_DATE}T00:00:00Z",
        "brand": brand,
        "tempClass": temp,
        "units": 10,
        "kg": kg,
        "m3": m3,
        "status": "RECEIVED",
        "deferredYesterday": False,
        "daysSince": 0,
        **extra,
    }


BASE: dict[str, list[dict[str, Any]]] = {
    "outlets": [
        outlet("S-01", "FRESH", "Alpha", "REAR_DOCK", "NORMAL", "04:00", "08:00"),
        outlet("S-02", "FRESH", "Alpha", "STREET", "NORMAL", "05:00", "08:00"),
        outlet("S-03", "FRESH", "Alpha", "STREET", "VAN_ONLY", "05:00", "08:00"),
        outlet("S-04", "FRESH", "Beta", "REAR_DOCK", "NORMAL", "04:30", "08:00"),
        outlet("S-05", "STYLE", "Alpha", "MALL_BAY", "MALL_DOCK", "10:00", "12:00"),
        outlet("S-06", "STYLE", "Alpha", "REAR_DOCK", "NORMAL", "09:00", "17:00"),
        outlet("S-99", "FRESH", "Alpha", "REAR_DOCK", "NORMAL", "04:00", "08:00", depot=OTHER_DEPOT),
    ],
    "vehicles": [
        vehicle("V-R1", "TRUCK", "CHILLED", 3000, 15, 6, 400, 100),
        vehicle("V-R2", "TRUCK", "CHILLED", 3000, 15, 6, 400, 100, status="WORKSHOP"),
        vehicle("V-D1", "TRUCK", "AMBIENT", 5000, 30, 5, 400, 50),
        vehicle("V-N1", "VAN", "CHILLED", 1000, 6, 10, 300, 20),
    ],
    "orders": [
        order("O-1", "S-01", "FRESH", "CHILLED", 400, 2.0),
        order("O-2", "S-02", "FRESH", "CHILLED", 300, 1.5, daysSince=1),
        order("O-3", "S-03", "FRESH", "CHILLED", 200, 1.0),
        order("O-4", "S-04", "FRESH", "AMBIENT", 500, 3.0),
        order("O-5", "S-05", "STYLE", "AMBIENT", 300, 4.0),
        order("O-6", "S-06", "STYLE", "AMBIENT", 300, 4.0),
        order("O-7", "S-04", "FRESH", "CHILLED", 250, 1.2, deferredYesterday=True, daysSince=3),
        order("O-99", "S-99", "FRESH", "CHILLED", 100, 0.5),
    ],
    "calendar": [
        {"date": RUN_DATE, "isOperating": True, "monsoon": 0},
        {"date": NEXT_DATE, "isOperating": True, "monsoon": 0},
    ],
    "districtTravel": [
        {"district": "Alpha", "depot": DEPOT, "roadClass": "urban", "depotToDistMin": 20, "interStopMin": 10, "distKm": 15},
        {"district": "Beta", "depot": DEPOT, "roadClass": "suburban", "depotToDistMin": 40, "interStopMin": 12, "distKm": 30},
        {"district": "Gamma", "depot": DEPOT, "roadClass": "hill", "depotToDistMin": 60, "interStopMin": 20, "distKm": 45},
    ],
    "serviceAllowances": [
        {"brand": "FRESH", "dockType": "REAR_DOCK", "minutes": 15},
        {"brand": "FRESH", "dockType": "STREET", "minutes": 16},
        {"brand": "STYLE", "dockType": "MALL_BAY", "minutes": 50},
        {"brand": "STYLE", "dockType": "REAR_DOCK", "minutes": 35},
    ],
}


def raw(**overrides: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    data = copy.deepcopy(BASE)
    data.update(copy.deepcopy(overrides))
    return data


def mall_conflict_raw() -> dict[str, list[dict[str, Any]]]:
    """A long Style run in Gamma (09:00) would push the mall stop in Alpha past its window."""
    data = raw()
    data["outlets"] += [
        outlet("S-07", "STYLE", "Gamma", "REAR_DOCK", "NORMAL", "09:00", "17:00"),
        outlet("S-08", "STYLE", "Gamma", "REAR_DOCK", "NORMAL", "09:00", "17:00"),
        outlet("S-09", "STYLE", "Gamma", "REAR_DOCK", "NORMAL", "09:00", "17:00"),
    ]
    data["outlets"] = [o for o in data["outlets"] if o["id"] != "S-06"]
    data["outlets"] = [({**o, "windowClose": "11:00"} if o["id"] == "S-05" else o) for o in data["outlets"]]
    data["orders"] = [o for o in data["orders"] if o["id"] not in ("O-4", "O-6")] + [
        order("O-8", "S-07", "STYLE", "AMBIENT", 200, 3.0),
        order("O-9", "S-08", "STYLE", "AMBIENT", 200, 3.0),
        order("O-10", "S-09", "STYLE", "AMBIENT", 200, 3.0),
    ]
    return data


def fuel_starved_raw() -> dict[str, list[dict[str, Any]]]:
    """Every vehicle is at its weekly fuel quota: no redraft can fix it."""
    data = raw()
    data["vehicles"] = [{**v, "usedLThisWeek": v["weeklyLFuel"]} for v in data["vehicles"]]
    return data
