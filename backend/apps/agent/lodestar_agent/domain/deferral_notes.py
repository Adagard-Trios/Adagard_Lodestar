"""Why each deferral candidate is one: reason code, plain explanation, limiting constraint, consequence.

Deterministic text from the reason code and the order's facts. Previously deferred orders (``deferredYesterday``)
are protected by the scoring (+40 and never deferred two days running), so they never appear here: they are
placed or go to the dispatcher as needs-review.
"""

from __future__ import annotations

from typing import Any

from .context import PlanningContext

LIMITS = {
    "CAP_REEFER": ("Not enough reefer space left for chilled stock.", "reefer volume (m3) of the available chilled vehicles"),
    "CAP_TIME": ("No vehicle had room left today in weight, volume, trips or driving minutes.", "vehicle capacity / 2 trips / daily minutes budget"),
    "ACCESS": ("The outlet only takes a van and no van had room.", "van_only access"),
    "WINDOW": ("No trip could arrive before the delivery window (or mall window) closes.", "delivery window close"),
    "FUEL": ("The vehicles that could serve it would pass their weekly fuel quota.", "weekly fuel quota (L)"),
    "VEH_DOWN": ("The only compatible vehicles are not available today.", "vehicle availability"),
}


def annotate(ctx: PlanningContext, deferrals: list[dict[str, Any]]) -> list[dict[str, Any]]:
    nxt = "the next-day run" if ctx.next_run_within_24h() else "the next operating run"
    out = []
    for d in deferrals:
        why, limit = LIMITS.get(d["reason"], LIMITS["CAP_TIME"])
        order = ctx.orders.get(d["orderId"], {})
        out.append(
            {
                **d,
                "explanation": f"{d['orderId']} ({d.get('m3', 0)} m3, score {d['score']}): {why}",
                "limitingConstraint": limit,
                "consequence": f"If you defer it, {d['outletId']} is served on {nxt} and is protected there (never deferred two days running).",
                "previouslyDeferred": bool(order.get("deferredYesterday")),
            }
        )
    return out
