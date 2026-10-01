"""Ask-panel tools answer only from the run snapshot."""

from __future__ import annotations

import json

from lodestar_agent.tools import build_ask_tools

from . import fixtures as fx


def summary(tools, name, args=None):
    return json.loads(next(t for t in tools if t.name == name).invoke(args or {}))["summary"]


def test_ask_tools_over_a_constrained_run(make_runtime):
    rt = make_runtime(fx.fuel_starved_raw())
    run = rt.start_run(fx.DEPOT, fx.RUN_DATE, "u")
    ctx, view = rt._context(run["id"])
    tools, proposals = build_ask_tools(ctx, view)

    assert "0 orders planned on 0 trips" in summary(tools, "plan_summary")
    assert "Deferral candidates, best first: #1" in summary(tools, "list_deferrals")
    assert "needs you: O-7" in summary(tools, "list_deferrals")
    assert "no reefer shortfall" in summary(tools, "capacity")
    assert "deferral candidate #" in summary(tools, "explain_order", {"order_id": "O-1"})
    assert "waiting for your review" in summary(tools, "explain_order", {"order_id": "O-7"})
    assert "protected" in summary(tools, "explain_order", {"order_id": "O-7"})
    assert "not an open order" in summary(tools, "explain_order", {"order_id": "O-404"})
    assert "WORKSHOP" in summary(tools, "lookup_vehicle", {"vehicle_id": "V-R2"})
    assert "available with no trips" in summary(tools, "lookup_vehicle", {"vehicle_id": "V-R1"})
    assert "not a vehicle of depot" in summary(tools, "lookup_vehicle", {"vehicle_id": "V-404"})
    assert "window 10:00-12:00; open orders: O-5" in summary(tools, "lookup_outlet", {"outlet_id": "S-05"})
    assert "not an outlet of depot" in summary(tools, "lookup_outlet", {"outlet_id": "S-99"})
    assert "All 7 hard rules pass" in summary(tools, "rule_checks")
    assert "it would break: V-D1 would reach" in summary(tools, "propose_edit", {"op": "move", "order_id": "O-5", "vehicle_id": "V-D1", "trip_no": 1})
    assert proposals[0]["edits"] == [{"op": "move", "orderId": "O-5", "vehicleId": "V-D1", "tripNo": 1}]


def test_ask_tools_report_violations_and_empty_deferrals(make_runtime):
    data = fx.raw()
    data["orders"] = [o for o in data["orders"] if o["id"] in ("O-1", "O-5")]
    data["vehicles"] = [({**v, "capacityM3": 3} if v["id"] == "V-N1" else v) for v in data["vehicles"]]
    rt = make_runtime(data)
    run = rt.start_run(fx.DEPOT, fx.RUN_DATE, "u")
    edited = rt.resume(run["id"], "edit", [{"op": "move", "orderId": "O-5", "vehicleId": "V-N1", "tripNo": 2}], "u", ["dispatcher"])
    ctx, view = rt._context(edited["id"])
    tools, _ = build_ask_tools(ctx, view)
    assert "No deferrals" in summary(tools, "list_deferrals")
    assert summary(tools, "rule_checks").startswith("Rules with problems")
    assert "it would break" in summary(tools, "propose_edit", {"op": "move", "order_id": "O-1", "vehicle_id": "V-N1", "trip_no": 2})
    assert "on V-N1 trip" in summary(tools, "explain_order", {"order_id": "O-5"})
    assert "min in total" in summary(tools, "lookup_vehicle", {"vehicle_id": "V-N1"})


def test_ask_before_a_draft_exists_is_a_conflict(make_runtime):
    import pytest

    from lodestar_agent.runtime import RunConflict

    rt = make_runtime()
    rt.graph.update_state(rt._config("run-empty"), {"runId": "run-empty", "depot": fx.DEPOT, "runDate": fx.RUN_DATE, "raw": {}})
    with pytest.raises(RunConflict):
        rt.ask("run-empty", "hello?")
