"""Vendor-neutral reading arithmetic."""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from fielddata_mcp.readings import Reading, daily_summary, parse_day, parse_utc, series


def reading(kind: str, quantity: float, at: datetime, channel: int | None = None) -> Reading:
    from fielddata_mcp.readings import UNITS

    return Reading(
        station_id="s1", vendor="ecowitt", sensor_kind=kind, channel=channel, channel_name=None,
        quantity=quantity, unit=UNITS[kind], observed_at=at,
    )


def test_parse_utc_takes_offsets_and_treats_bare_times_as_utc():
    assert parse_utc("2026-10-29T06:00:00Z", name="start") == datetime(2026, 10, 29, 6, tzinfo=UTC)
    assert parse_utc("2026-10-29T02:00:00-04:00", name="start") == datetime(2026, 10, 29, 6, tzinfo=UTC)
    assert parse_utc("2026-10-29 06:00", name="start") == datetime(2026, 10, 29, 6, tzinfo=UTC)


@pytest.mark.parametrize("bad", ["", "yesterday", "2026-13-01", None, 42])
def test_parse_utc_refuses_by_name(bad):
    with pytest.raises(ValueError, match="start must be"):
        parse_utc(bad, name="start")


def test_parse_day():
    assert parse_day("2026-10-29", name="d") == date(2026, 10, 29)
    with pytest.raises(ValueError, match="d must be a date"):
        parse_day("10/29/2026", name="d")


def test_series_groups_by_kind_and_channel_in_time_order():
    t0 = datetime(2026, 10, 29, tzinfo=UTC)
    rows = [
        reading("soil_moisture", 40, t0 + timedelta(hours=1), channel=2),
        reading("soil_moisture", 41, t0, channel=2),
        reading("soil_moisture", 30, t0, channel=1),
        reading("air_temperature", 5.0, t0),
    ]

    out = series(rows)

    assert [(s["sensor_kind"], s["channel"]) for s in out] == [
        ("air_temperature", None), ("soil_moisture", 1), ("soil_moisture", 2),
    ]
    assert out[2]["points"] == [["2026-10-29T00:00:00Z", 41], ["2026-10-29T01:00:00Z", 40]]
    assert out[1]["unit"] == "%"


def test_daily_summary_frost_rain_and_degree_days_by_local_day():
    zone = ZoneInfo("America/New_York")
    day1 = datetime(2026, 10, 27, tzinfo=zone)
    rows = []
    # Day 1: -2 °C for two half-hour samples, then 4, 20 → min -2, max 20.
    for i, t in enumerate([-2.0, -1.0, 4.0, 20.0]):
        rows.append(reading("air_temperature", t, (day1 + timedelta(hours=6 * i)).astimezone(UTC)))
    # Rain running total resets at local midnight; the day's rain is its highest value.
    rows += [reading("rain_total", v, (day1 + timedelta(hours=h)).astimezone(UTC)) for h, v in [(1, 0.5), (12, 3.2), (23, 3.2)]]
    # A sample just after local midnight belongs to day 2, though it is still day 1 in UTC terms… and vice versa.
    rows.append(reading("air_temperature", 12.0, (day1 + timedelta(days=1, minutes=30)).astimezone(UTC)))

    out = daily_summary(
        rows, zone=zone, first_day=date(2026, 10, 27), last_day=date(2026, 10, 29), base_c=10.0, sample_hours=0.5,
    )

    d1, d2, d3 = out["days"]
    assert d1 == {
        "date": "2026-10-27", "samples": 4, "temp_min_c": -2.0, "temp_max_c": 20.0, "temp_mean_c": 5.2,
        "frost_hours": 1.0, "degree_days": 0.0, "rain_mm": 3.2,
    }
    assert d2["samples"] == 1 and d2["degree_days"] == 2.0 and d2["rain_mm"] is None
    assert d3 == {
        "date": "2026-10-29", "samples": 0, "temp_min_c": None, "temp_max_c": None, "temp_mean_c": None,
        "frost_hours": None, "degree_days": None, "rain_mm": None,
    }
    assert out["totals"] == {"frost_hours": 1.0, "rain_mm": 3.2, "degree_days": 2.0}
    assert out["base_c"] == 10.0


def test_degree_days_never_go_negative():
    t = datetime(2026, 1, 5, 12, tzinfo=UTC)
    out = daily_summary(
        [reading("air_temperature", -5.0, t), reading("air_temperature", 2.0, t + timedelta(hours=1))],
        zone=ZoneInfo("UTC"), first_day=date(2026, 1, 5), last_day=date(2026, 1, 5), base_c=10.0, sample_hours=0.5,
    )
    assert out["days"][0]["degree_days"] == 0.0
