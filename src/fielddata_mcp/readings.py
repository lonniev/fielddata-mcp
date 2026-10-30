"""The vendor-neutral reading, and the arithmetic done over readings.

Every adapter turns its vendor's payload into ``Reading`` values; nothing past
this module ever sees a vendor field name. Quantities are SI, times are UTC.

Pure logic: no I/O, no npub, no SDK imports.
"""

from __future__ import annotations

import uuid
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

# sensor_kind → the one SI unit it is always reported in.
UNITS: dict[str, str] = {
    "air_temperature": "°C",
    "relative_humidity": "%",
    "pressure": "hPa",
    "wind_speed": "m/s",
    "wind_direction": "deg",
    "rain_rate": "mm/h",
    "rain_total": "mm",
    "solar_radiation": "W/m²",
    "uv_index": "index",
    "soil_moisture": "%",
    "soil_temperature": "°C",
    "leaf_wetness": "%",
}

SENSOR_KINDS = frozenset(UNITS)

# Fixed namespace so a vendor device always maps to the same station_id.
_STATION_NAMESPACE = uuid.UUID("5bdb8963-9d54-46f8-854c-528d175f28ff")


def station_id_for(vendor: str, device_key: str) -> str:
    """Stable, opaque fielddata id for one vendor device."""
    return str(uuid.uuid5(_STATION_NAMESPACE, f"{vendor}:{device_key}"))


@dataclass(frozen=True)
class Station:
    """One vendor device as the patron's account reports it.

    ``device_ref`` is the vendor's own handle (a MAC, an IMEI) and stays inside
    the adapter; tools show ``station_id`` instead.
    """

    station_id: str
    vendor: str
    name: str
    timezone: str
    latitude: float | None
    longitude: float | None
    model: str
    device_ref: dict[str, str] = field(repr=False)

    def zone(self) -> ZoneInfo:
        try:
            return ZoneInfo(self.timezone)
        except (KeyError, ValueError):
            return ZoneInfo("UTC")

    def as_dict(self) -> dict[str, Any]:
        return {
            "station_id": self.station_id,
            "vendor": self.vendor,
            "name": self.name,
            "timezone": self.timezone,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "model": self.model,
        }


@dataclass(frozen=True)
class Reading:
    station_id: str
    vendor: str
    sensor_kind: str
    channel: int | None
    channel_name: str | None
    quantity: float
    unit: str
    observed_at: datetime

    def as_dict(self) -> dict[str, Any]:
        return {
            "station_id": self.station_id,
            "vendor": self.vendor,
            "sensor_kind": self.sensor_kind,
            "channel": self.channel,
            "channel_name": self.channel_name,
            "quantity": self.quantity,
            "unit": self.unit,
            "observed_at": utc_iso(self.observed_at),
        }


def utc_iso(moment: datetime) -> str:
    return moment.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_utc(text: str, *, name: str) -> datetime:
    """Parse an ISO-8601 instant. A time with no offset is taken as UTC."""
    try:
        moment = datetime.fromisoformat(text.strip())
    except (AttributeError, ValueError):
        raise ValueError(f"{name} must be an ISO-8601 time such as 2026-10-29T06:00:00Z.") from None
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=UTC)
    return moment.astimezone(UTC)


def parse_day(text: str, *, name: str) -> date:
    try:
        return date.fromisoformat(text.strip())
    except (AttributeError, ValueError):
        raise ValueError(f"{name} must be a date such as 2026-10-29.") from None


def series(readings: list[Reading]) -> list[dict[str, Any]]:
    """Group readings into one time series per sensor and channel."""
    grouped: dict[tuple[str, int | None], list[Reading]] = defaultdict(list)
    for reading in readings:
        grouped[(reading.sensor_kind, reading.channel)].append(reading)
    out = []
    for (kind, channel), rows in sorted(grouped.items(), key=lambda kv: (kv[0][0], kv[0][1] or 0)):
        rows.sort(key=lambda r: r.observed_at)
        out.append({
            "sensor_kind": kind,
            "channel": channel,
            "channel_name": rows[0].channel_name,
            "unit": UNITS[kind],
            "points": [[utc_iso(r.observed_at), r.quantity] for r in rows],
        })
    return out


def daily_summary(
    readings: list[Reading],
    *,
    zone: ZoneInfo,
    first_day: date,
    last_day: date,
    base_c: float,
    sample_hours: float,
) -> dict[str, Any]:
    """Per local day: air temperature min, max and mean; frost hours; rain; degree-days.

    Frost hours count samples at or below 0 °C, each standing for
    ``sample_hours``. Rain is the day's highest running total, the vendor's
    rain_total resetting at local midnight. Degree-days use the daily mean
    method, ``max(0, (min + max) / 2 - base_c)``. A day with no samples is
    reported with nulls rather than dropped.
    """
    temps: dict[date, list[float]] = defaultdict(list)
    rain: dict[date, float] = {}
    for reading in readings:
        day = reading.observed_at.astimezone(zone).date()
        if not first_day <= day <= last_day:
            continue
        if reading.sensor_kind == "air_temperature":
            temps[day].append(reading.quantity)
        elif reading.sensor_kind == "rain_total":
            rain[day] = max(rain.get(day, 0.0), reading.quantity)

    days = []
    totals = {"frost_hours": 0.0, "rain_mm": 0.0, "degree_days": 0.0}
    day = first_day
    while day <= last_day:
        samples = temps.get(day, [])
        row: dict[str, Any] = {"date": day.isoformat(), "samples": len(samples)}
        if samples:
            low, high = min(samples), max(samples)
            frost = sum(1 for t in samples if t <= 0.0) * sample_hours
            gdd = max(0.0, (low + high) / 2 - base_c)
            row |= {
                "temp_min_c": round(low, 1),
                "temp_max_c": round(high, 1),
                "temp_mean_c": round(sum(samples) / len(samples), 1),
                "frost_hours": round(frost, 1),
                "degree_days": round(gdd, 1),
            }
            totals["frost_hours"] += frost
            totals["degree_days"] += gdd
        else:
            row |= dict.fromkeys(("temp_min_c", "temp_max_c", "temp_mean_c", "frost_hours", "degree_days"))
        row["rain_mm"] = round(rain[day], 1) if day in rain else None
        totals["rain_mm"] += rain.get(day, 0.0)
        days.append(row)
        day += timedelta(days=1)

    return {
        "base_c": base_c,
        "days": days,
        "totals": {k: round(v, 1) for k, v in totals.items()},
    }


# What a day's rows may be ordered by. A name outside it orders by date.
_DAY_SORTS = frozenset(
    {"date", "temp_min_c", "temp_max_c", "temp_mean_c", "frost_hours", "rain_mm", "degree_days"}
)


def page_of_days(
    days: list[dict[str, Any]],
    *,
    sort_col: str,
    sort_dir: str,
    page: int,
    page_size: int,
) -> dict[str, Any]:
    """One page of the days, ordered over all of them.

    A day with no value for the column sorts last in either direction. The
    page is clamped to the last one there is, so a shorter range can never
    answer with an empty page.
    """
    col = sort_col if sort_col in _DAY_SORTS else "date"
    known = sorted((d for d in days if d[col] is not None), key=lambda d: d[col], reverse=sort_dir == "desc")
    ordered = known + [d for d in days if d[col] is None]
    size = max(1, page_size)
    last = max(0, (len(ordered) - 1) // size)
    at = min(max(0, page), last)
    return {
        "days": ordered[at * size : (at + 1) * size],
        "total": len(ordered),
        "page": at,
        "page_size": size,
        "sort_col": col,
        "sort_dir": "desc" if sort_dir == "desc" else "asc",
    }
