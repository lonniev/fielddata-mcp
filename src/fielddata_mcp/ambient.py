"""Ambient Weather cloud adapter (ambientweather.net), the twin of ``ecowitt``.

Pure domain logic: every function takes the patron's ``AmbientKeys`` and returns
plain values or ``Reading``s. No npub, no billing, no SDK imports.

API reference: https://github.com/ambient-weather/api-docs. The account's keys go
in the query string (the API offers no header), so no URL built here may reach a
log, an exception or a response.

Ambient has one fixed set of imperial field names, so conversion is by field. It
allows one request a second per API key and answers 288 rows a request, newest
first, stored every 5 or 30 minutes.
"""

from __future__ import annotations

import asyncio
import math
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any
from urllib.parse import quote

import httpx

from fielddata_mcp.readings import UNITS, Reading, Station, VendorError, station_id_for

VENDOR = "ambient"
LABEL = "Ambient Weather"
_BASE = "https://rt.ambientweather.net/v1"
_TIMEOUT = 20.0
_ROWS_PER_REQUEST = 288
_REQUEST_GAP_SECONDS = 1.1
_ATTEMPTS = 3
_MAX_PAGES = 40

# History resolution → (longest span per call in days, how far back it reaches in
# days). Spans keep paging at one request a second bearable; Ambient states no reach.
HISTORY_LIMITS: dict[str, tuple[int, int]] = {
    "5min": (7, 365),
    "30min": (31, 365),
}
SAMPLE_HOURS = {"5min": 5 / 60, "30min": 0.5}


def _celsius(fahrenheit: float) -> float:
    return round((fahrenheit - 32.0) * 5 / 9, 2)


def _scaled(factor: float) -> Any:
    return lambda value: round(value * factor, 3)


_SAME = _scaled(1.0)
_MM = _scaled(25.4)

# Field → (sensor_kind, channel, convert to the kind's SI unit).
# temp1f..temp10f are left out: they are general-purpose extra sensors, and calling
# them air temperature would corrupt the daily summary.
_FIELDS: dict[str, tuple[str, int | None, Any]] = {
    "tempf": ("air_temperature", None, _celsius),
    "humidity": ("relative_humidity", None, _SAME),
    "baromrelin": ("pressure", None, _scaled(33.8639)),
    "windspeedmph": ("wind_speed", None, _scaled(0.44704)),
    "winddir": ("wind_direction", None, _SAME),
    "hourlyrainin": ("rain_rate", None, _MM),
    "dailyrainin": ("rain_total", None, _MM),
    "solarradiation": ("solar_radiation", None, _SAME),
    "uv": ("uv_index", None, _SAME),
    **{f"soilhum{n}": ("soil_moisture", n, _SAME) for n in range(1, 11)},
    **{f"soiltemp{n}f": ("soil_temperature", n, _celsius) for n in range(1, 11)},
    **{f"leafwetness{n}": ("leaf_wetness", n, _SAME) for n in range(1, 9)},
}

# A console with no outdoor sensor reports its built-in one; that stands in.
_INDOOR_STAND_INS = {"tempf": "tempinf", "humidity": "humidityin"}


@dataclass(frozen=True)
class AmbientKeys:
    application_key: str = field(repr=False)
    api_key: str = field(repr=False)


async def _get(client: httpx.AsyncClient, path: str, keys: AmbientKeys, params: dict[str, Any] | None = None) -> Any:
    query = {"applicationKey": keys.application_key, "apiKey": keys.api_key, **(params or {})}
    for attempt in range(_ATTEMPTS):
        try:
            resp = await client.get(f"{_BASE}{path}", params=query)
        except httpx.HTTPError:
            # The exception's text would name the URL, keys and all.
            raise VendorError("Ambient Weather could not be reached. Retry shortly.") from None
        if resp.status_code != 429:
            break
        if attempt < _ATTEMPTS - 1:
            await asyncio.sleep(_REQUEST_GAP_SECONDS)
    else:
        raise VendorError("Ambient Weather is busy. Retry shortly.")
    if resp.status_code in (401, 403):
        raise VendorError("Ambient Weather rejected the keys.", rejects_keys=True)
    if not resp.is_success:
        raise VendorError(f"Ambient Weather returned HTTP {resp.status_code}.")
    try:
        return resp.json()
    except ValueError:
        raise VendorError("Ambient Weather sent a response that is not JSON.") from None


def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=_TIMEOUT)


async def _devices(client: httpx.AsyncClient, keys: AmbientKeys) -> list[dict[str, Any]]:
    body = await _get(client, "/devices", keys)
    if not isinstance(body, list):
        raise VendorError("Ambient Weather sent a response of an unexpected shape.")
    return [d for d in body if isinstance(d, dict)]


# ---------------------------------------------------------------------------
# Stations
# ---------------------------------------------------------------------------


def _station(raw: dict[str, Any]) -> Station | None:
    mac = raw.get("macAddress")
    if not mac:
        return None
    key = str(mac).upper()
    info = raw.get("info") if isinstance(raw.get("info"), dict) else {}
    last = raw.get("lastData") if isinstance(raw.get("lastData"), dict) else {}
    outer = info.get("coords") if isinstance(info.get("coords"), dict) else {}
    coords = outer.get("coords") if isinstance(outer.get("coords"), dict) else {}
    return Station(
        station_id=station_id_for(VENDOR, key),
        vendor=VENDOR,
        name=str(info.get("name") or key),
        timezone=str(last.get("tz") or "UTC"),
        latitude=_float(coords.get("lat")),
        longitude=_float(coords.get("lon")),
        model="",
        device_ref={"mac": str(mac)},
    )


async def list_stations(keys: AmbientKeys) -> list[Station]:
    """Every device on the patron's Ambient Weather account."""
    async with _client() as client:
        return [s for raw in await _devices(client, keys) if (s := _station(raw))]


# ---------------------------------------------------------------------------
# Readings
# ---------------------------------------------------------------------------


async def real_time(keys: AmbientKeys, station: Station) -> list[Reading]:
    """The latest value of every sensor the station reports."""
    async with _client() as client:
        devices = await _devices(client, keys)
    wanted = station.device_ref["mac"].upper()
    for device in devices:
        if str(device.get("macAddress") or "").upper() == wanted:
            return normalize([device.get("lastData")], station)
    raise VendorError("Ambient Weather does not know that device on this account.")


async def history(
    keys: AmbientKeys,
    station: Station,
    start: datetime,
    end: datetime,
    resolution: str,
    kinds: frozenset[str],
) -> list[Reading]:
    """Readings between ``start`` and ``end`` (UTC), thinned to one per resolution step.

    Pages backward from ``end``, one request a second. Thinning keeps a sample
    standing for the same time on a 5-minute device and a 30-minute one, which
    the frost-hour arithmetic relies on.
    """
    start_ms, cursor = _ms(start), _ms(end)
    path = f"/devices/{quote(station.device_ref['mac'], safe='')}"
    rows: list[Any] = []
    async with _client() as client:
        for page in range(_MAX_PAGES):
            if page:
                await asyncio.sleep(_REQUEST_GAP_SECONDS)
            batch = await _get(client, path, keys, {"endDate": cursor, "limit": _ROWS_PER_REQUEST})
            if not isinstance(batch, list) or not batch:
                break
            rows += batch
            stamps = [s for s in (_row_ms(r) for r in batch) if s is not None]
            if not stamps or min(stamps) <= start_ms or min(stamps) >= cursor:
                break
            cursor = min(stamps) - 1
    wanted = [r for r in normalize(rows, station) if r.sensor_kind in kinds and start <= r.observed_at <= end]
    return _thinned(wanted, SAMPLE_HOURS[resolution])


def normalize(rows: list[Any], station: Station) -> list[Reading]:
    """Turn Ambient data points into Readings. A value that is absent or not a number is skipped."""
    readings: list[Reading] = []
    for row in rows:
        stamp = _row_ms(row)
        if stamp is None:
            continue
        observed = datetime.fromtimestamp(stamp / 1000, tz=UTC)
        for name, (kind, channel, convert) in _FIELDS.items():
            value = _float(row.get(name))
            if value is None and name in _INDOOR_STAND_INS:
                value = _float(row.get(_INDOOR_STAND_INS[name]))
            if value is None:
                continue
            readings.append(Reading(
                station_id=station.station_id,
                vendor=VENDOR,
                sensor_kind=kind,
                channel=channel,
                channel_name=None,
                quantity=convert(value),
                unit=UNITS[kind],
                observed_at=observed,
            ))
    return readings


def _thinned(readings: list[Reading], sample_hours: float) -> list[Reading]:
    """The earliest reading of each sensor in each step of ``sample_hours``, oldest first."""
    step = sample_hours * 3600
    kept: dict[tuple[str, int | None, int], Reading] = {}
    for r in sorted(readings, key=lambda r: r.observed_at):
        kept.setdefault((r.sensor_kind, r.channel, int(r.observed_at.timestamp() // step)), r)
    return list(kept.values())


def _ms(moment: datetime) -> int:
    return int(moment.timestamp() * 1000)


def _row_ms(row: Any) -> int | None:
    if not isinstance(row, dict):
        return None
    stamp = _float(row.get("dateutc"))
    return None if stamp is None else int(stamp)


def _float(raw: Any) -> float | None:
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return None
    return None if math.isnan(value) or math.isinf(value) else value
