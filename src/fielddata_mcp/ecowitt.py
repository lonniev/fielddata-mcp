"""Ecowitt.net v3 cloud adapter.

Pure domain logic: every function takes the patron's ``EcowittKeys`` and
returns plain values or ``Reading``s. No npub, no billing, no SDK imports.

API reference: https://doc.ecowitt.net/web/#/apiv3en. Every Ecowitt gateway,
the 4G WittField included, uploads to Ecowitt.net, so this one adapter covers
the whole line. The account's keys go in the query string (the API offers no
header), so no URL built here may reach a log, an exception or a response.

Ecowitt defaults to imperial units. We ask for SI with the ``*_unitid``
parameters and still convert by the unit string each value arrives with, so a
response that ignores the request cannot slip a Fahrenheit value through.
"""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

import httpx

from fielddata_mcp.readings import UNITS, Reading, Station, station_id_for

logger = logging.getLogger(__name__)

# httpx logs every request URL at INFO, and Ecowitt's URLs carry the keys.
logging.getLogger("httpx").setLevel(logging.WARNING)

VENDOR = "ecowitt"
_BASE = "https://api.ecowitt.net/api/v3"
_TIMEOUT = 20.0
_PAGE_SIZE = 50

_SI_UNIT_PARAMS = {
    "temp_unitid": 1,  # °C
    "pressure_unitid": 3,  # hPa
    "wind_speed_unitid": 6,  # m/s
    "rainfall_unitid": 12,  # mm
    "solar_irradiance_unitid": 16,  # W/m²
}

# History resolution → (longest span per request in days, how far back it reaches in days).
HISTORY_LIMITS: dict[str, tuple[int, int]] = {
    "5min": (1, 90),
    "30min": (7, 365),
    "4hour": (31, 730),
    "1day": (366, 1460),
}
SAMPLE_HOURS = {"5min": 5 / 60, "30min": 0.5, "4hour": 4.0, "1day": 24.0}

# (group, field) → sensor_kind, for groups that are not numbered channels.
_FIXED_FIELDS: dict[tuple[str, str], str] = {
    ("outdoor", "temperature"): "air_temperature",
    ("outdoor", "humidity"): "relative_humidity",
    ("pressure", "relative"): "pressure",
    ("wind", "wind_speed"): "wind_speed",
    ("wind", "wind_direction"): "wind_direction",
    ("rainfall", "rain_rate"): "rain_rate",
    ("rainfall", "daily"): "rain_total",
    ("solar_and_uvi", "solar"): "solar_radiation",
    ("solar_and_uvi", "uvi"): "uv_index",
}

# Channel group prefix → (field, sensor_kind). The WN34 soil probe reports as temp_chN.
_CHANNEL_FIELDS: dict[str, tuple[str, str]] = {
    "soil_ch": ("soilmoisture", "soil_moisture"),
    "temp_ch": ("temperature", "soil_temperature"),
    "leaf_ch": ("leaf_wetness", "leaf_wetness"),
}
_CHANNEL_COUNTS = {"soil_ch": 16, "temp_ch": 8, "leaf_ch": 8}

# Groups asked for in a history call, keyed by the sensor_kind that needs them.
_KIND_GROUPS: dict[str, tuple[str, ...]] = {
    "air_temperature": ("outdoor", "indoor"),
    "relative_humidity": ("outdoor", "indoor"),
    "pressure": ("pressure",),
    "wind_speed": ("wind",),
    "wind_direction": ("wind",),
    "rain_rate": ("rainfall", "rainfall_piezo"),
    "rain_total": ("rainfall", "rainfall_piezo"),
    "solar_radiation": ("solar_and_uvi",),
    "uv_index": ("solar_and_uvi",),
    "soil_moisture": tuple(f"soil_ch{n}" for n in range(1, 17)),
    "soil_temperature": tuple(f"temp_ch{n}" for n in range(1, 9)),
    "leaf_wetness": tuple(f"leaf_ch{n}" for n in range(1, 9)),
}

_ERROR_WORDING = {
    -1: "Ecowitt is busy. Retry shortly.",
    40010: "Ecowitt rejected the Application Key. It may have been deleted at ecowitt.net.",
    40011: "Ecowitt rejected the API Key. It may have been deleted at ecowitt.net.",
    40012: "Ecowitt does not know that device on this account.",
}


class EcowittError(Exception):
    """An Ecowitt failure worth naming to the caller. Never carries a key or a URL."""

    def __init__(self, message: str, *, code: int | None = None) -> None:
        super().__init__(message)
        self.code = code

    @property
    def rejects_keys(self) -> bool:
        return self.code in (40010, 40011, 40017, 40018)


@dataclass(frozen=True)
class EcowittKeys:
    application_key: str = field(repr=False)
    api_key: str = field(repr=False)


async def _get(client: httpx.AsyncClient, path: str, keys: EcowittKeys, params: dict[str, Any]) -> Any:
    query = {"application_key": keys.application_key, "api_key": keys.api_key, **params}
    try:
        resp = await client.get(f"{_BASE}{path}", params=query)
    except httpx.HTTPError:
        # The exception's text would name the URL, keys and all.
        raise EcowittError("Ecowitt could not be reached. Retry shortly.") from None
    if not resp.is_success:
        raise EcowittError(f"Ecowitt returned HTTP {resp.status_code}.")
    try:
        body = resp.json()
    except ValueError:
        raise EcowittError("Ecowitt sent a response that is not JSON.") from None
    if not isinstance(body, dict):
        raise EcowittError("Ecowitt sent a response of an unexpected shape.")
    code = body.get("code")
    if code != 0:
        code_int = code if isinstance(code, int) else None
        wording = _ERROR_WORDING.get(code_int) or f"Ecowitt refused the request: {str(body.get('msg') or code)[:120]}"
        raise EcowittError(wording, code=code_int)
    return body.get("data")


def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=_TIMEOUT)


# ---------------------------------------------------------------------------
# Stations
# ---------------------------------------------------------------------------


def _station(raw: dict[str, Any]) -> Station | None:
    mac, imei = raw.get("mac"), raw.get("imei")
    if mac:
        device_ref, key = {"mac": str(mac)}, str(mac).upper()
    elif imei:
        device_ref, key = {"imei": str(imei)}, str(imei)
    else:
        return None
    return Station(
        station_id=station_id_for(VENDOR, key),
        vendor=VENDOR,
        name=str(raw.get("name") or key),
        timezone=str(raw.get("date_zone_id") or "UTC"),
        latitude=_float(raw.get("latitude")),
        longitude=_float(raw.get("longitude")),
        model=str(raw.get("stationtype") or ""),
        device_ref=device_ref,
    )


async def list_stations(keys: EcowittKeys) -> list[Station]:
    """Every device on the patron's Ecowitt account, every page of it."""
    stations: list[Station] = []
    async with _client() as client:
        page = 1
        while True:
            data = await _get(client, "/device/list", keys, {"limit": _PAGE_SIZE, "page": page})
            if not isinstance(data, dict):
                break
            for raw in data.get("list") or []:
                if isinstance(raw, dict) and (station := _station(raw)):
                    stations.append(station)
            if page >= int(data.get("totalPage") or 1):
                break
            page += 1
    return stations


# ---------------------------------------------------------------------------
# Readings
# ---------------------------------------------------------------------------


async def real_time(keys: EcowittKeys, station: Station) -> list[Reading]:
    """The latest value of every sensor the station reports (Ecowitt keeps two hours)."""
    async with _client() as client:
        data = await _get(client, "/device/real_time", keys, {
            **station.device_ref, "call_back": "all", **_SI_UNIT_PARAMS,
        })
    return normalize(data, station, history=False)


async def history(
    keys: EcowittKeys,
    station: Station,
    start: datetime,
    end: datetime,
    resolution: str,
    kinds: frozenset[str],
) -> list[Reading]:
    """Readings between ``start`` and ``end`` (UTC) at one resolution, one request.

    The caller keeps the span within ``HISTORY_LIMITS``. Ecowitt takes local
    times with no offset, so the window is sent in the station's zone and the
    answer is trimmed back to the UTC window.
    """
    zone = station.zone()
    groups = sorted({g for kind in kinds for g in _KIND_GROUPS[kind]})
    async with _client() as client:
        data = await _get(client, "/device/history", keys, {
            **station.device_ref,
            "start_date": start.astimezone(zone).strftime("%Y-%m-%d %H:%M:%S"),
            "end_date": end.astimezone(zone).strftime("%Y-%m-%d %H:%M:%S"),
            "cycle_type": resolution,
            "call_back": ",".join(groups),
            **_SI_UNIT_PARAMS,
        })
    return [
        r for r in normalize(data, station, history=True)
        if r.sensor_kind in kinds and start <= r.observed_at <= end
    ]


def normalize(data: Any, station: Station, *, history: bool) -> list[Reading]:
    """Turn a real_time or history ``data`` object into Readings.

    A gateway with no outdoor sensor (a GW1200 on its own) reports its built-in
    sensor as ``indoor``; that stands in for air temperature and humidity. A
    traditional rain gauge wins over a piezo one when both report.
    """
    if not isinstance(data, dict):
        return []
    groups = dict(data)
    if not _has_values(groups.get("outdoor")) and isinstance(groups.get("indoor"), dict):
        groups["outdoor"] = groups["indoor"]
    if not _has_values(groups.get("rainfall")) and isinstance(groups.get("rainfall_piezo"), dict):
        groups["rainfall"] = groups["rainfall_piezo"]

    readings: list[Reading] = []

    def emit(kind: str, channel: int | None, value: Any) -> None:
        if not isinstance(value, dict):
            return
        unit = str(value.get("unit") or "")
        if history:
            points = value.get("list")
            pairs = points.items() if isinstance(points, dict) else ()
        else:
            pairs = [(value.get("time"), value.get("value"))]
        for stamp, raw in pairs:
            observed = _instant(stamp)
            quantity = _to_si(kind, _float(raw), unit)
            if observed is None or quantity is None:
                continue
            readings.append(Reading(
                station_id=station.station_id,
                vendor=VENDOR,
                sensor_kind=kind,
                channel=channel,
                channel_name=None,
                quantity=quantity,
                unit=UNITS[kind],
                observed_at=observed,
            ))

    for (group, name), kind in _FIXED_FIELDS.items():
        block = groups.get(group)
        if isinstance(block, dict):
            emit(kind, None, block.get(name))
    for prefix, (name, kind) in _CHANNEL_FIELDS.items():
        for n in range(1, _CHANNEL_COUNTS[prefix] + 1):
            block = groups.get(f"{prefix}{n}")
            if isinstance(block, dict):
                emit(kind, n, block.get(name))
    return readings


def _has_values(block: Any) -> bool:
    return isinstance(block, dict) and bool(block)


def _instant(stamp: Any) -> datetime | None:
    try:
        return datetime.fromtimestamp(int(stamp), tz=UTC)
    except (TypeError, ValueError, OverflowError, OSError):
        return None


def _float(raw: Any) -> float | None:
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return None
    return None if math.isnan(value) else value


# Unit string as Ecowitt writes it → (SI unit family, factor, offset).
_TEMPERATURE = {"℃": (1.0, 0.0), "ºC": (1.0, 0.0), "°C": (1.0, 0.0),
                "℉": (5 / 9, -32.0), "ºF": (5 / 9, -32.0), "°F": (5 / 9, -32.0)}
_SCALE: dict[str, dict[str, float]] = {
    "pressure": {"hPa": 1.0, "inHg": 33.8639, "mmHg": 1.333224},
    "wind_speed": {"m/s": 1.0, "km/h": 1 / 3.6, "mph": 0.44704, "knots": 0.514444},
    "rain_rate": {"mm/hr": 1.0, "mm/h": 1.0, "in/hr": 25.4, "in/h": 25.4},
    "rain_total": {"mm": 1.0, "in": 25.4},
    "solar_radiation": {"W/m²": 1.0, "W/m2": 1.0},
    "wind_direction": {"º": 1.0, "°": 1.0, "": 1.0},
    "uv_index": {"": 1.0},
}
_PERCENT = {"relative_humidity", "soil_moisture", "leaf_wetness"}


def _to_si(kind: str, value: float | None, unit: str) -> float | None:
    """Convert to the kind's SI unit, or None when the unit is not one we know."""
    if value is None:
        return None
    if kind in ("air_temperature", "soil_temperature"):
        if unit not in _TEMPERATURE:
            logger.warning("Ecowitt sent %s in an unknown unit %r; reading skipped", kind, unit)
            return None
        factor, offset = _TEMPERATURE[unit]
        return round((value + offset) * factor, 2)
    if kind in _PERCENT:
        return value if unit in ("%", "") else None
    factor = _SCALE[kind].get(unit)
    if factor is None:
        logger.warning("Ecowitt sent %s in an unknown unit %r; reading skipped", kind, unit)
        return None
    return round(value * factor, 3)
