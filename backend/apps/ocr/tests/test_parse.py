import pytest

from lodestar_ocr.parse import best_value


@pytest.mark.parametrize(
    "lines, want",
    [
        ([("3.5°C", 0.9)], "3.5"),
        ([("TEMP", 0.9), ("-18.0 C", 0.8)], "-18.0"),
        ([("SET 4", 0.9), ("2,5℃", 0.8)], "2.5"),
        ([("TRUCK WP-1234", 0.9), ("4.2oC", 0.7)], "4.2"),
        ([("41°F", 0.9)], "5"),
        ([("+4", 0.9)], "4"),
    ],
)
def test_temperature(lines, want):
    value, conf = best_value("temperature", lines)
    assert value == want
    assert conf > 0


def test_temperature_out_of_range_or_missing():
    assert best_value("temperature", [("ROUTE 120", 0.9)]) == (None, 0.0)
    assert best_value("temperature", []) == (None, 0.0)


@pytest.mark.parametrize(
    "kind, lines, want",
    [
        ("seal", [("WAYPOINT", 0.9), ("SL-004512", 0.95)], "SL-004512"),
        ("seal", [("seal no", 0.9), ("SL 004512", 0.95)], "SL004512"),
        ("label", [("Keells Fresh", 0.9), ("LBL 88123455", 0.8)], "LBL88123455"),
        ("code", [("4791234567890", 0.99)], "4791234567890"),
    ],
)
def test_codes(kind, lines, want):
    assert best_value(kind, lines)[0] == want


def test_code_needs_digits():
    assert best_value("code", [("FRAGILE", 0.9)]) == (None, 0.0)


def test_text_joins_lines():
    value, conf = best_value("text", [("Box crushed", 0.9), ("2 units", 0.7)])
    assert value == "Box crushed 2 units"
    assert conf == pytest.approx(0.8)
