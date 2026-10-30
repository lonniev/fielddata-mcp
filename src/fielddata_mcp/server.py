"""FieldData MCP — a patron's own field instruments, in one vendor-neutral shape.

Reads the patron's weather station and soil probes through the vendor's cloud
API, under the patron's own vendor keys, and returns every value in SI units
and UTC. Standard DPYC tools (balance, purchase, Secure Courier, Oracle,
pricing) come from ``register_standard_tools``; only the field tools live here.

Run locally:
    python -m fielddata_mcp.server
"""

from __future__ import annotations

import logging
from datetime import UTC, date, datetime, time, timedelta
from typing import Any

from fastmcp import FastMCP
from mcp.types import Icon
from tollbooth.credential_templates import CredentialTemplate, FieldSpec
from tollbooth.credential_validators import validate_btcpay_creds
from tollbooth.params import PatronNpub
from tollbooth.runtime import OperatorRuntime, register_standard_tools
from tollbooth.session_cache import SessionCache
from tollbooth.tool_identity import READS_REMOTE, STANDARD_IDENTITIES, ToolIdentity

from fielddata_mcp import __version__, ambient, ecowitt
from fielddata_mcp.readings import (
    SENSOR_KINDS,
    Reading,
    Station,
    VendorError,
    daily_summary,
    page_of_days,
    parse_day,
    parse_utc,
    series,
    utc_iso,
)

logger = logging.getLogger(__name__)

mcp = FastMCP(
    "fielddata-mcp",
    version=__version__,
    website_url="https://github.com/lonniev/fielddata-mcp",
    icons=[Icon(src="https://tollbooth-dpyc.com/dpyc-logo.png", mimeType="image/png")],
    instructions=(
        "FieldData — what your own ground actually measured, from your weather station and soil probes. "
        "Monetized via Tollbooth DPYC Bitcoin Lightning micropayments.\n\n"
        "## What it answers\n"
        "fielddata_list_stations names your stations and the sensors each one reports.\n"
        "fielddata_current gives a station's latest readings.\n"
        "fielddata_history gives readings over a time range.\n"
        "fielddata_summary gives daily temperature, frost hours, rain and degree-days.\n"
        "Every reading is in SI units and UTC, whatever station made it.\n"
        "The web app at https://fielddata.tollbooth-dpyc.com shows the same readings as a panel of instruments.\n\n"
        "## Bring your own station keys\n"
        "Your stations stay on your own vendor account, and this operator reads them with your keys.\n"
        "FieldData reads Ecowitt and Ambient Weather stations, and you may connect either account or both.\n"
        "For an Ecowitt station, make an Application Key and an API Key at ecowitt.net under your account's "
        "API settings.\n"
        "For an Ambient Weather station, make an API Key and an Application Key at ambientweather.net/account.\n"
        "1. Call `fielddata_get_patron_onboarding_status` to see what is missing.\n"
        "2. Call `fielddata_request_patron_credentials` with your npub — you get a Nostr DM.\n"
        "3. Reply with your keys.\n"
        "4. Call `fielddata_receive_patron_credentials` to vault them.\n"
        "Stations are found from your account; you never type one in.\n\n"
        "## Operator onboarding\n"
        "Call fielddata_get_operator_onboarding_status to check readiness.\n"
        "1. Register with an Authority (provides a Neon database automatically)\n"
        "2. Deliver operator secrets via Secure Courier: btcpay_host, btcpay_api_key, btcpay_store_id\n"
        "   Call fielddata_request_credential_channel to start.\n\n"
        "## Pricing\n"
        "Tool prices are set by the operator's pricing model. "
        "Use `fielddata_check_price` to preview a fare and `fielddata_check_balance` to see your balance."
    ),
)

# ---------------------------------------------------------------------------
# Tool registry
# ---------------------------------------------------------------------------

# Frozen UUIDs — declared once at tool birth and never changed.
LIST_STATIONS_UUID = "6df77ba3-ac6a-4b0f-8577-677f9337b5d1"
CURRENT_READINGS_UUID = "49ed55e2-864c-4424-a546-4ffc93c864e0"
READING_HISTORY_UUID = "c731f39a-66ee-4960-a3aa-4b6b70e1c44d"
DAILY_SUMMARY_UUID = "951d0219-e985-4f57-8897-34868d67a058"

_DOMAIN_TOOLS = [
    ToolIdentity(
        tool_id=LIST_STATIONS_UUID,
        capability="list_stations",
        category="read",
        title="Your stations",
        behavior=READS_REMOTE,
        intent="List the patron's stations, their sensors and channels",
    ),
    ToolIdentity(
        tool_id=CURRENT_READINGS_UUID,
        capability="current_readings",
        category="read",
        title="Current readings",
        behavior=READS_REMOTE,
        intent="Latest readings for one station",
    ),
    ToolIdentity(
        tool_id=READING_HISTORY_UUID,
        capability="reading_history",
        category="heavy",
        title="Reading history",
        behavior=READS_REMOTE,
        intent="Readings over a time range at a chosen resolution",
    ),
    ToolIdentity(
        tool_id=DAILY_SUMMARY_UUID,
        capability="daily_summary",
        category="write",
        title="Daily summary",
        behavior=READS_REMOTE,
        intent="Daily temperature, frost hours, rain and degree-days",
    ),
]

TOOL_REGISTRY: dict[str, ToolIdentity] = {ti.tool_id: ti for ti in _DOMAIN_TOOLS}

# ---------------------------------------------------------------------------
# OperatorRuntime
# ---------------------------------------------------------------------------

# Vendor → its adapter and the two credential fields that make its keys.
ADAPTERS: dict[str, Any] = {ecowitt.VENDOR: ecowitt, ambient.VENDOR: ambient}
_KEY_FIELDS: dict[str, tuple[str, str, Any]] = {
    ecowitt.VENDOR: ("ecowitt_application_key", "ecowitt_api_key", ecowitt.EcowittKeys),
    ambient.VENDOR: ("ambient_application_key", "ambient_api_key", ambient.AmbientKeys),
}


class FieldDataRuntime(OperatorRuntime):
    """Readiness for a patron who may hold either vendor's keys.

    Every key field is optional, since no one vendor is required, and the SDK
    calls a template with no required field ready. Here ready needs one whole pair.
    """

    async def patron_onboarding_status(self, patron_npub: str) -> dict[str, Any]:
        status = await super().patron_onboarding_status(patron_npub)
        have = {entry["field"] for entry in status["configured"]}
        if any(app in have and api in have for app, api, _ in _KEY_FIELDS.values()):
            return status
        situation = status.get("vault_situation")
        missing = [
            {
                "field": name,
                "category": "patron_secret",
                "status": "unknown" if situation else "missing",
                "lifecycle": spec.lifecycle,
                "how": spec.description,
            }
            for name, spec in _PATRON_TEMPLATE.fields.items()
            if name not in have
        ]
        summary = status["summary"] if situation else (
            "Missing: both keys of one station account, Ecowitt or Ambient Weather."
        )
        return {**status, "ready": False, "missing": missing, "summary": summary}

    async def courier(self) -> Any:
        """The SDK's courier, told to drop a patron's cached keys on every delivery.

        The SDK takes this callback only at the courier's construction and
        passes none, so it is set here.
        """
        service = await super().courier()
        if service is not None:
            service._on_received = _on_credentials_delivered
        return service

    async def store_patron_session(self, patron_npub: str, *args: Any, **kwargs: Any) -> bool:
        """A field-level update or delete lands here, and the cached keys go with it."""
        stored = await super().store_patron_session(patron_npub, *args, **kwargs)
        _forget_cached_keys(patron_npub)
        return stored


# Each patron brings their own vendor keys; the operator holds no vendor account.
# Field names carry the vendor because both vendors use the same two names, and
# each is optional because a patron may hold either pair or both.
_PATRON_TEMPLATE = CredentialTemplate(
    service="fielddata",
    version=1,
    description="Your own weather-station account keys: one whole pair, Ecowitt or Ambient Weather, or both",
    fields={
        "ecowitt_application_key": FieldSpec(
            required=False, sensitive=True,
            description=(
                "Your Ecowitt Application Key. Log in at ecowitt.net, open your "
                "account's API settings and create one."
            ),
        ),
        "ecowitt_api_key": FieldSpec(
            required=False, sensitive=True,
            description="Your Ecowitt API Key, made in the same place as the Application Key.",
        ),
        "ambient_application_key": FieldSpec(
            required=False, sensitive=True,
            description=(
                "Your Ambient Weather Application Key. Log in at ambientweather.net "
                "and create one on your account page."
            ),
        ),
        "ambient_api_key": FieldSpec(
            required=False, sensitive=True,
            description="Your Ambient Weather API Key, made in the same place as the Application Key.",
        ),
    },
)

runtime = FieldDataRuntime(
    service_name="FieldData",
    tool_registry={**STANDARD_IDENTITIES, **TOOL_REGISTRY},
    operator_credential_template=CredentialTemplate(
        service="fielddata-operator",
        version=1,
        description="Operator credentials for BTCPay Lightning payments",
        fields={
            "btcpay_host": FieldSpec(
                required=True, sensitive=True,
                description=(
                    "The URL of your BTCPay Server instance "
                    "(e.g. https://btcpay.example.com)."
                ),
            ),
            "btcpay_api_key": FieldSpec(
                required=True, sensitive=True,
                description=(
                    "Your BTCPay Server API key. Generate one in BTCPay "
                    "under Account > Manage Account > API Keys."
                ),
            ),
            "btcpay_store_id": FieldSpec(
                required=True, sensitive=True,
                description=(
                    "Your BTCPay Store ID. Find it in BTCPay under "
                    "Stores > Settings > General."
                ),
            ),
        },
    ),
    patron_credential_template=_PATRON_TEMPLATE,
    operator_credential_greeting=(
        "Hi — I'm FieldData, a Tollbooth service that reads growers' own field "
        "instruments. You (the operator) need to provide BTCPay credentials."
    ),
    patron_credential_greeting=(
        "Hi — I'm FieldData. You (or your AI agent) requested a credential channel. "
        "Reply with both keys of your Ecowitt account, your Ambient Weather account, or both; "
        "they are encrypted at rest and used only for your calls."
    ),
    credential_validator=validate_btcpay_creds,
    on_forget=lambda service, npub: _on_credentials_forgotten(service, npub),
    # Connections authenticate as holders: each npub proven through one stays
    # with it, so tool calls pass only the npub.
    holder_auth_url="https://fielddata-mcp.fastmcp.app",
)

tool = register_standard_tools(
    mcp,
    "fielddata",
    runtime,
    service_name="fielddata-mcp",
    service_version=__version__,
)

# ---------------------------------------------------------------------------
# Patron keys and the short cache
# ---------------------------------------------------------------------------

# A patron's keys, held only long enough to spare the vault a read per call.
_keys: SessionCache[dict[str, Any]] = SessionCache(ttl_seconds=900)
# Vendor answers for about as long as the vendor's own refresh, so repeat calls
# spend neither the patron's vendor quota nor a slow round trip. Keyed by npub.
_answers: SessionCache[Any] = SessionCache(ttl_seconds=60, max_size=4096)
_revoked_npubs: set[str] = set()


def _forget_cached_keys(npub: str) -> None:
    """The next call reads the vault, so what was just stored takes effect at once."""
    _keys.clear(npub)
    _revoked_npubs.discard(npub)


async def _on_credentials_delivered(npub: str, credentials: dict[str, str], service: str) -> None:
    _forget_cached_keys(npub)


def _on_credentials_forgotten(service: str, npub: str) -> None:
    """Drop cached keys so the next call re-reads the vault (and finds none)."""
    _keys.clear(npub)
    _revoked_npubs.add(npub)
    logger.info("Session cleared for %s (service=%s)", npub[:20], service)


# Every lifecycle state gets its own sentence. A patron whose vault could not
# be READ must never be told to re-deliver keys that are sitting in it.
_SESSION_GUIDANCE: dict[str, str] = {
    "no_credentials": (
        "No station keys are stored for your identity. This is expected on first use. "
        "Action: call fielddata_request_patron_credentials with your npub, then reply "
        "to the Nostr DM with your Ecowitt or Ambient Weather Application Key and API Key."
    ),
    "credentials_revoked": (
        "Your station keys were cleared by a previous forget_credentials call. "
        "Action: call fielddata_request_patron_credentials to deliver fresh keys."
    ),
    "keys_rejected": (
        "Your {label} account rejected the stored keys; they may have been deleted there. "
        "Action: call fielddata_request_patron_credentials to deliver fresh keys."
    ),
    "vault_bootstrapping": (
        "The server is establishing its encrypted connection to the credential vault. "
        "This happens once after a cold start. Action: repeat your request shortly — "
        "no re-onboarding needed."
    ),
    "secure_courier_unavailable": (
        "The Secure Courier isn't available yet, so the credential vault can't be reached. "
        "Your stored keys are unaffected. Action: repeat your request shortly."
    ),
    "operator_not_configured": (
        "The vault answered but held no complete set of station keys for you. "
        "Action: call fielddata_request_patron_credentials to deliver them."
    ),
    "persistence_quota_exceeded": (
        "The operator's database has reached its provider quota, so stored keys cannot "
        "be read right now. Retrying will not help and your keys are unaffected. "
        "Action: notify the operator — capacity is restored by their Authority."
    ),
    "persistence_misconfigured": (
        "The operator's credential store rejected the read with a permanent error. "
        "This will not resolve by retrying and your keys are unaffected. Action: notify the operator."
    ),
}


async def _require_keys(npub: str) -> dict[str, Any]:
    """Resolve ``npub`` to that patron's keys, vendor by vendor, or refuse by name. A half pair is no pair."""
    if npub in _revoked_npubs:
        _keys.clear(npub)
        _revoked_npubs.discard(npub)
        raise ValueError(_SESSION_GUIDANCE["credentials_revoked"])

    cached = _keys.get(npub)
    if cached:
        return cached

    creds, vault_situation = await runtime.load_patron_session(npub)
    if vault_situation:
        raise ValueError(
            _SESSION_GUIDANCE.get(vault_situation, _SESSION_GUIDANCE["vault_bootstrapping"]),
        )
    held = {
        vendor: make(application_key=creds[app], api_key=creds[api])
        for vendor, (app, api, make) in _KEY_FIELDS.items()
        if creds and creds.get(app) and creds.get(api)
    }
    if held:
        return _keys.set(npub, held)
    if creds is not None:
        raise ValueError(_SESSION_GUIDANCE["operator_not_configured"])
    raise ValueError(_SESSION_GUIDANCE["no_credentials"])


async def _vendor(npub: str, vendor: str, cache_key: str, fn: Any, *args: Any) -> Any:
    """Call one vendor's adapter under the patron's keys, through the short cache.

    A vendor failure raises, so the fare is refunded; the patron is never
    charged for an answer that did not come.
    """
    key = f"{npub}|{vendor}|{cache_key}"
    hit = _answers.get(key)
    if hit is not None:
        return hit
    keys = (await _require_keys(npub)).get(vendor)
    if keys is None:
        raise ValueError(_SESSION_GUIDANCE["no_credentials"])
    try:
        answer = await fn(keys, *args)
    except VendorError as exc:
        if exc.rejects_keys:
            _keys.clear(npub)
            raise ValueError(_SESSION_GUIDANCE["keys_rejected"].format(label=ADAPTERS[vendor].LABEL)) from None
        raise ValueError(str(exc)) from None
    return _answers.set(key, answer)


async def _stations(npub: str) -> list[Station]:
    """Every station on every account the patron has connected."""
    found: list[Station] = []
    for vendor in await _require_keys(npub):
        found += await _vendor(npub, vendor, "stations", ADAPTERS[vendor].list_stations)
    return found


async def _current(npub: str, station: Station) -> list[Reading]:
    return await _vendor(
        npub, station.vendor, f"current|{station.station_id}", ADAPTERS[station.vendor].real_time, station,
    )


async def _resolve_station(npub: str, station: str) -> Station:
    """Find one station by id, by name, or by a part of its name only it has.

    An empty ``station`` means the patron's only station.
    """
    stations = await _stations(npub)
    if not stations:
        raise ValueError("Your station account lists no devices. Register the gateway with your vendor first.")
    wanted = (station or "").strip()
    if len(wanted) > 200:
        raise ValueError("station is too long.")
    if not wanted:
        if len(stations) == 1:
            return stations[0]
        raise ValueError("You have several stations; name one: " + _roster(stations))
    for s in stations:
        if s.station_id == wanted:
            return s
    needle = wanted.casefold()
    exact = [s for s in stations if s.name.casefold() == needle]
    if len(exact) == 1:
        return exact[0]
    partial = exact or [s for s in stations if needle in s.name.casefold()]
    if len(partial) == 1:
        return partial[0]
    if partial:
        raise ValueError(f"'{wanted}' matches several stations; name one: " + _roster(partial))
    raise ValueError(f"No station matches '{wanted}'. Your stations: " + _roster(stations))


def _roster(stations: list[Station]) -> str:
    return "; ".join(f"{s.name} ({s.station_id})" for s in stations)


def _kinds(sensor_kind: str) -> frozenset[str]:
    if not sensor_kind:
        return SENSOR_KINDS
    if sensor_kind not in SENSOR_KINDS:
        raise ValueError("sensor_kind must be one of: " + ", ".join(sorted(SENSOR_KINDS)))
    return frozenset({sensor_kind})


def _choose_resolution(
    resolution: str,
    start: datetime,
    end: datetime,
    now: datetime,
    limits: dict[str, tuple[int, int]],
) -> str:
    """Check a resolution against the vendor's span and reach limits, or pick the finest that fits."""
    span = end - start
    age = now - start
    if resolution == "auto":
        for name, (span_days, reach_days) in limits.items():
            if span <= timedelta(days=span_days) and age <= timedelta(days=reach_days):
                return name
        longest = max(s for s, _ in limits.values())
        farthest = max(r for _, r in limits.values())
        raise ValueError(
            f"That range is longer than one call can cover. Use at most {longest} days within the last {farthest} days.",
        )
    if resolution not in limits:
        raise ValueError("resolution must be auto, " + ", ".join(limits) + ".")
    span_days, reach_days = limits[resolution]
    if span > timedelta(days=span_days):
        raise ValueError(f"At {resolution}, one request covers at most {span_days} day(s).")
    if age > timedelta(days=reach_days):
        raise ValueError(f"{resolution} data reaches back only {reach_days} days.")
    return resolution


# ---------------------------------------------------------------------------
# Domain tools
# ---------------------------------------------------------------------------


@tool
@runtime.paid_tool(LIST_STATIONS_UUID)
async def list_stations(npub: PatronNpub = "") -> dict[str, Any]:
    """List your stations and the sensors and channels each one reports.

    Stations come from your own station account; each has a stable station_id
    the other tools accept, as do its name or a part of the name only it has.
    """
    out = []
    for station in await _stations(npub):
        readings = await _current(npub, station)
        sensors = sorted(
            {(r.sensor_kind, r.channel, r.channel_name) for r in readings},
            key=lambda s: (s[0], s[1] or 0),
        )
        out.append(station.as_dict() | {
            "sensors": [{"sensor_kind": k, "channel": c, "channel_name": n} for k, c, n in sensors],
        })
    return {"success": True, "stations": out}


@tool
@runtime.paid_tool(CURRENT_READINGS_UUID)
async def current(
    station: str = "",
    sensor_kind: str = "",
    npub: PatronNpub = "",
) -> dict[str, Any]:
    """Get the latest readings from one station.

    Args:
        station: The station's id, its name, or a part of its name only it has.
            Leave empty when you have one station.
        sensor_kind: Only this kind of reading, e.g. soil_moisture. Empty for all.
    """
    kinds = _kinds(sensor_kind)
    found = await _resolve_station(npub, station)
    readings = await _current(npub, found)
    return {
        "success": True,
        "station": found.as_dict(),
        "readings": [r.as_dict() for r in readings if r.sensor_kind in kinds],
    }


@tool
@runtime.paid_tool(READING_HISTORY_UUID)
async def history(
    start: str,
    end: str,
    station: str = "",
    resolution: str = "auto",
    sensor_kind: str = "",
    npub: PatronNpub = "",
) -> dict[str, Any]:
    """Get readings over a time range, one series per sensor and channel.

    An Ecowitt station: one call covers at most 1 day at 5min, 7 days at 30min,
    31 days at 4hour or 366 days at 1day. Finer data reaches back less far: 90
    days at 5min, 365 at 30min, 730 at 4hour and 1460 at 1day.

    An Ambient Weather station: one call covers at most 7 days at 5min or 31 days
    at 30min, within the last 365 days, and a long one takes a while because
    Ambient allows one request a second.

    Args:
        start: Start time, ISO-8601 (a time without an offset is UTC).
        end: End time, ISO-8601, after start.
        station: The station's id, its name, or a part of its name only it has.
            Leave empty when you have one station.
        resolution: auto (the finest the range allows), or one the station's vendor offers.
        sensor_kind: Only this kind of reading, e.g. soil_temperature. Empty for all.
    """
    kinds = _kinds(sensor_kind)
    begin, finish = parse_utc(start, name="start"), parse_utc(end, name="end")
    now = datetime.now(UTC)
    if finish <= begin:
        raise ValueError("end must be after start.")
    if begin > now:
        raise ValueError("start is in the future.")
    finish = min(finish, now)
    found = await _resolve_station(npub, station)
    adapter = ADAPTERS[found.vendor]
    chosen = _choose_resolution(resolution, begin, finish, now, adapter.HISTORY_LIMITS)
    readings = await _vendor(
        npub,
        found.vendor,
        f"history|{found.station_id}|{utc_iso(begin)}|{utc_iso(finish)}|{chosen}|{','.join(sorted(kinds))}",
        adapter.history, found, begin, finish, chosen, kinds,
    )
    return {
        "success": True,
        "station": found.as_dict(),
        "start": utc_iso(begin),
        "end": utc_iso(finish),
        "resolution": chosen,
        "series": series(readings),
    }


_SUMMARY_MAX_DAYS = 31
_SUMMARY_RESOLUTION = "30min"
_SUMMARY_KINDS = frozenset({"air_temperature", "rain_total"})


@tool
@runtime.paid_tool(DAILY_SUMMARY_UUID)
async def summary(
    start_date: str,
    end_date: str,
    station: str = "",
    base_c: float = 10.0,
    sort_col: str = "date",
    sort_dir: str = "asc",
    page: int = 0,
    page_size: int = _SUMMARY_MAX_DAYS,
    npub: PatronNpub = "",
) -> dict[str, Any]:
    """Summarize each day: air temperature min, max and mean, frost hours, rain and degree-days.

    Days are the station's local calendar days, both ends included, at most 31
    of them within the last 365 days. Frost hours count time at or below 0 °C.
    Degree-days use the daily mean method above base_c. A day the station did
    not report is listed with nulls.

    Args:
        start_date: First day, YYYY-MM-DD.
        end_date: Last day, YYYY-MM-DD.
        station: The station's id, its name, or a part of its name only it has.
            Leave empty when you have one station.
        base_c: Degree-day base temperature in °C, e.g. 10 for maize, 4.5 for peas.
        sort_col: date, temp_min_c, temp_max_c, temp_mean_c, frost_hours, rain_mm
            or degree_days. Ordering covers every day in the range.
        sort_dir: asc or desc.
        page: Zero-based page of the ordered days.
        page_size: Days per page. The default returns the whole range.
    """
    if not -10.0 <= base_c <= 40.0:
        raise ValueError("base_c must be between -10 and 40 °C.")
    first, last = parse_day(start_date, name="start_date"), parse_day(end_date, name="end_date")
    if last < first:
        raise ValueError("end_date must not be before start_date.")
    if (last - first).days + 1 > _SUMMARY_MAX_DAYS:
        raise ValueError(f"A summary covers at most {_SUMMARY_MAX_DAYS} days.")
    found = await _resolve_station(npub, station)
    adapter = ADAPTERS[found.vendor]
    zone = found.zone()
    now = datetime.now(UTC)
    today = now.astimezone(zone).date()
    if first > today:
        raise ValueError("start_date is in the future.")
    if (today - first).days > adapter.HISTORY_LIMITS[_SUMMARY_RESOLUTION][1]:
        raise ValueError("A summary reaches back at most 365 days.")
    last = min(last, today)

    readings = []
    for begin, finish in _weekly_windows(first, last, zone, now):
        readings += await _vendor(
            npub,
            found.vendor,
            f"history|{found.station_id}|{utc_iso(begin)}|{utc_iso(finish)}|{_SUMMARY_RESOLUTION}|summary",
            adapter.history, found, begin, finish, _SUMMARY_RESOLUTION, _SUMMARY_KINDS,
        )
    whole = daily_summary(
        readings,
        zone=zone,
        first_day=first,
        last_day=last,
        base_c=base_c,
        sample_hours=adapter.SAMPLE_HOURS[_SUMMARY_RESOLUTION],
    )
    return {
        "success": True,
        "station": found.as_dict(),
        "start_date": first.isoformat(),
        "end_date": last.isoformat(),
        **whole,
        **page_of_days(whole["days"], sort_col=sort_col, sort_dir=sort_dir, page=page, page_size=page_size),
    }


def _weekly_windows(first: date, last: date, zone: Any, now: datetime) -> list[tuple[datetime, datetime]]:
    """UTC windows of at most one week covering local days ``first``..``last``, clipped to now."""
    windows = []
    start = datetime.combine(first, time.min, tzinfo=zone)
    stop = min(datetime.combine(last + timedelta(days=1), time.min, tzinfo=zone), now)
    while start < stop:
        end = min(start + timedelta(days=7), stop)
        windows.append((start.astimezone(UTC), (end - timedelta(seconds=1)).astimezone(UTC)))
        start = end
    return windows


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> None:
    """Main entry point for the server."""
    from tollbooth import validate_operator_tools

    missing = validate_operator_tools(mcp, "fielddata")
    if missing:
        import sys

        print(
            f"⚠ Missing base-catalog tools: {', '.join(missing)}",
            file=sys.stderr,
        )
    mcp.run()


if __name__ == "__main__":
    main()
