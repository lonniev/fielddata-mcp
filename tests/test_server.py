"""Server wiring: tool names, argument guards, station lookup and the short cache."""

from __future__ import annotations

import inspect
from datetime import UTC, date, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from fielddata_mcp import ambient, ecowitt, server
from fielddata_mcp.readings import Station

NOW = datetime(2026, 10, 29, 12, tzinfo=UTC)
NPUB = "npub1test"


def make_station(name: str, sid: str) -> Station:
    return Station(
        station_id=sid, vendor="ecowitt", name=name, timezone="UTC",
        latitude=None, longitude=None, model="GW1200", device_ref={"mac": "AA:BB"},
    )


@pytest.fixture(autouse=True)
def fresh_caches():
    for key in list(server._answers._entries):
        server._answers.clear(key)
    for key in list(server._keys._entries):
        server._keys.clear(key)
    yield


async def test_field_tools_carry_the_fielddata_prefix_and_no_vendor_name():
    tools = await server.mcp.list_tools()
    names = {t.name for t in tools}

    assert {"fielddata_list_stations", "fielddata_current", "fielddata_history", "fielddata_summary"} <= names
    assert not [n for n in names if "ecowitt" in n]


# ---------------------------------------------------------------------------
# Resolution and windows
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(("span", "age", "expected"), [
    (timedelta(hours=6), timedelta(days=2), "5min"),
    (timedelta(days=3), timedelta(days=10), "30min"),
    (timedelta(hours=6), timedelta(days=120), "30min"),
    (timedelta(days=20), timedelta(days=30), "4hour"),
    (timedelta(days=200), timedelta(days=400), "1day"),
])
def test_auto_picks_the_finest_resolution_that_fits(span, age, expected):
    start = NOW - age
    assert server._choose_resolution("auto", start, start + span, NOW, ecowitt.HISTORY_LIMITS) == expected


@pytest.mark.parametrize(("resolution", "span", "age", "message"), [
    ("5min", timedelta(days=2), timedelta(days=3), "at most 1 day"),
    ("5min", timedelta(hours=1), timedelta(days=100), "reaches back only 90"),
    ("hourly", timedelta(hours=1), timedelta(days=1), "resolution must be"),
    ("auto", timedelta(days=400), timedelta(days=500), "longer than one call"),
])
def test_resolution_limits_refuse_by_name(resolution, span, age, message):
    start = NOW - age
    with pytest.raises(ValueError, match=message):
        server._choose_resolution(resolution, start, start + span, NOW, ecowitt.HISTORY_LIMITS)


def test_weekly_windows_cover_local_days_without_overlap():
    zone = ZoneInfo("America/New_York")
    windows = server._weekly_windows(date(2026, 10, 1), date(2026, 10, 10), zone, NOW)

    assert len(windows) == 2
    assert windows[0][0] == datetime(2026, 10, 1, tzinfo=zone).astimezone(UTC)
    assert windows[1][1] == (datetime(2026, 10, 11, tzinfo=zone) - timedelta(seconds=1)).astimezone(UTC)
    for begin, end in windows:
        assert end - begin < timedelta(days=7)
    assert windows[0][1] < windows[1][0]


def test_weekly_windows_stop_at_now():
    windows = server._weekly_windows(date(2026, 10, 29), date(2026, 10, 29), ZoneInfo("UTC"), NOW)
    assert windows == [(datetime(2026, 10, 29, tzinfo=UTC), NOW - timedelta(seconds=1))]


def test_sensor_kind_is_checked():
    assert server._kinds("soil_moisture") == frozenset({"soil_moisture"})
    with pytest.raises(ValueError, match="sensor_kind must be one of"):
        server._kinds("soil_ph")


# ---------------------------------------------------------------------------
# Station lookup
# ---------------------------------------------------------------------------


@pytest.fixture
def roster(monkeypatch):
    stations = [make_station("Lower Meadow", "id-1"), make_station("Upper Meadow", "id-2"), make_station("Barn", "id-3")]

    async def fake(npub):
        return stations

    monkeypatch.setattr(server, "_stations", fake)
    return stations


async def test_station_by_id_name_or_unique_part(roster):
    assert (await server._resolve_station(NPUB, "id-2")).name == "Upper Meadow"
    assert (await server._resolve_station(NPUB, "barn")).station_id == "id-3"
    assert (await server._resolve_station(NPUB, "Lower")).station_id == "id-1"


async def test_ambiguous_or_unknown_station_names_the_choices(roster):
    with pytest.raises(ValueError, match="matches several") as caught:
        await server._resolve_station(NPUB, "meadow")
    assert "id-1" in str(caught.value) and "id-2" in str(caught.value)
    with pytest.raises(ValueError, match="No station matches"):
        await server._resolve_station(NPUB, "orchard")
    with pytest.raises(ValueError, match="several stations"):
        await server._resolve_station(NPUB, "")


async def test_empty_station_means_the_only_one(monkeypatch):
    only = make_station("Field", "id-9")

    async def fake(npub):
        return [only]

    monkeypatch.setattr(server, "_stations", fake)
    assert await server._resolve_station(NPUB, "") is only


# ---------------------------------------------------------------------------
# Keys and the short cache
# ---------------------------------------------------------------------------


@pytest.fixture
def stored_keys(monkeypatch):
    calls = []

    async def load(npub):
        calls.append(npub)
        return {"ecowitt_application_key": "A-SECRET", "ecowitt_api_key": "B-SECRET"}, ""

    monkeypatch.setattr(server.runtime, "load_patron_session", load)
    return calls


async def test_answers_are_cached_per_patron(stored_keys):
    hits = []

    async def fetch(keys):
        hits.append(keys)
        return ["answer"]

    assert await server._vendor(NPUB, "ecowitt", "stations", fetch) == ["answer"]
    assert await server._vendor(NPUB, "ecowitt", "stations", fetch) == ["answer"]
    assert len(hits) == 1
    await server._vendor("npub1other", "ecowitt", "stations", fetch)
    assert len(hits) == 2


async def test_vendor_failure_raises_so_the_fare_is_refunded(stored_keys):
    async def fetch(keys):
        raise ecowitt.EcowittError("Ecowitt is busy. Retry shortly.", code=-1)

    with pytest.raises(ValueError, match="busy"):
        await server._vendor(NPUB, "ecowitt", "stations", fetch)


async def test_rejected_keys_are_dropped_and_named(stored_keys):
    async def fetch(keys):
        raise ecowitt.EcowittError("rejected", code=40011)

    with pytest.raises(ValueError, match="Your Ecowitt account rejected the stored keys") as caught:
        await server._vendor(NPUB, "ecowitt", "stations", fetch)
    assert "SECRET" not in str(caught.value)
    assert server._keys.get(NPUB) is None


@pytest.mark.parametrize(("creds", "situation", "message"), [
    (None, "", "No station keys are stored"),
    ({"ecowitt_application_key": "A"}, "", "no complete set"),
    (None, "vault_bootstrapping", "establishing its encrypted connection"),
    (None, "persistence_quota_exceeded", "quota"),
])
async def test_missing_or_unreadable_keys_say_what_to_do(monkeypatch, creds, situation, message):
    async def load(npub):
        return creds, situation

    monkeypatch.setattr(server.runtime, "load_patron_session", load)
    with pytest.raises(ValueError, match=message):
        await server._require_keys(NPUB)


# ---------------------------------------------------------------------------
# The summary, sorted and paged
# ---------------------------------------------------------------------------


async def test_summary_tool_pages_its_ordered_days_and_totals_the_whole_range(monkeypatch):
    async def station(npub, name):
        return make_station("Back forty", "s1")

    async def vendor(npub, vendor, cache_key, fn, *args):
        return []

    monkeypatch.setattr(server, "_resolve_station", station)
    monkeypatch.setattr(server, "_vendor", vendor)

    out = await inspect.unwrap(server.summary)(
        "2026-10-01", "2026-10-05", sort_col="date", sort_dir="desc", page=1, page_size=2, npub=NPUB,
    )

    assert [d["date"] for d in out["days"]] == ["2026-10-03", "2026-10-02"]
    assert (out["total"], out["page"], out["page_size"]) == (5, 1, 2)
    assert out["totals"]["rain_mm"] == 0.0


async def test_summary_tool_returns_the_whole_range_in_date_order_by_default(monkeypatch):
    async def station(npub, name):
        return make_station("Back forty", "s1")

    async def vendor(npub, vendor, cache_key, fn, *args):
        return []

    monkeypatch.setattr(server, "_resolve_station", station)
    monkeypatch.setattr(server, "_vendor", vendor)

    out = await inspect.unwrap(server.summary)("2026-10-01", "2026-10-08", npub=NPUB)

    assert [d["date"] for d in out["days"]] == [f"2026-10-0{n}" for n in range(1, 9)]
    assert out["total"] == 8


# ---------------------------------------------------------------------------
# Two vendors
# ---------------------------------------------------------------------------

BOTH = {
    "ecowitt_application_key": "EA-SECRET", "ecowitt_api_key": "EB-SECRET",
    "ambient_application_key": "AA-SECRET", "ambient_api_key": "AB-SECRET",
}
ONLY_AMBIENT = {"ambient_application_key": "AA-SECRET", "ambient_api_key": "AB-SECRET"}


def load_returning(monkeypatch, creds):
    async def load(npub):
        return creds, ""

    monkeypatch.setattr(server.runtime, "load_patron_session", load)


async def test_a_half_pair_of_one_vendor_does_not_hide_the_other(monkeypatch):
    load_returning(monkeypatch, {**ONLY_AMBIENT, "ecowitt_api_key": "HALF"})
    held = await server._require_keys(NPUB)
    assert set(held) == {"ambient"} and isinstance(held["ambient"], ambient.AmbientKeys)


async def test_stations_are_the_union_of_connected_accounts(monkeypatch):
    load_returning(monkeypatch, BOTH)

    async def eco(keys):
        assert keys.api_key == "EB-SECRET"
        return [make_station("Barn", "e1")]

    async def amb(keys):
        assert keys.api_key == "AB-SECRET"
        return [make_station("Vines", "a1")]

    monkeypatch.setattr(ecowitt, "list_stations", eco)
    monkeypatch.setattr(ambient, "list_stations", amb)
    assert {s.station_id for s in await server._stations(NPUB)} == {"e1", "a1"}


async def test_one_vendor_only_never_calls_the_other(monkeypatch):
    load_returning(monkeypatch, ONLY_AMBIENT)

    async def eco(keys):
        raise AssertionError("Ecowitt was called with no Ecowitt keys")

    async def amb(keys):
        return [make_station("Vines", "a1")]

    monkeypatch.setattr(ecowitt, "list_stations", eco)
    monkeypatch.setattr(ambient, "list_stations", amb)
    assert [s.station_id for s in await server._stations(NPUB)] == ["a1"]


async def test_current_goes_to_the_stations_own_vendor(monkeypatch):
    load_returning(monkeypatch, BOTH)
    called = []

    async def amb(keys, station):
        called.append(keys.api_key)
        return []

    monkeypatch.setattr(ambient, "real_time", amb)
    station = Station(
        station_id="a1", vendor="ambient", name="Vines", timezone="UTC",
        latitude=None, longitude=None, model="", device_ref={"mac": "AA"},
    )
    await server._current(NPUB, station)
    assert called == ["AB-SECRET"]


async def test_rejected_ambient_keys_name_ambient(monkeypatch):
    load_returning(monkeypatch, ONLY_AMBIENT)

    async def fetch(keys):
        raise server.VendorError("no", rejects_keys=True)

    with pytest.raises(ValueError, match="Your Ambient Weather account rejected") as caught:
        await server._vendor(NPUB, "ambient", "stations", fetch)
    assert "SECRET" not in str(caught.value)


def test_each_vendor_has_its_own_resolutions():
    start = NOW - timedelta(days=20)
    assert server._choose_resolution("auto", start, NOW, NOW, ambient.HISTORY_LIMITS) == "30min"
    with pytest.raises(ValueError, match="auto, 5min, 30min."):
        server._choose_resolution("1day", start, NOW, NOW, ambient.HISTORY_LIMITS)


def test_the_summary_resolution_exists_for_every_vendor():
    for adapter in server.ADAPTERS.values():
        assert server._SUMMARY_RESOLUTION in adapter.HISTORY_LIMITS
        assert server._SUMMARY_RESOLUTION in adapter.SAMPLE_HOURS


@pytest.mark.parametrize(("stored", "ready", "missing_has"), [
    ({}, False, "ambient_api_key"),
    ({"ecowitt_api_key": "x"}, False, "ecowitt_application_key"),
    ({"ecowitt_api_key": "x", "ambient_application_key": "y"}, False, "ambient_api_key"),
    ({"ecowitt_application_key": "x", "ecowitt_api_key": "y"}, True, None),
    (ONLY_AMBIENT, True, None),
    (BOTH, True, None),
])
async def test_ready_needs_one_whole_pair(monkeypatch, stored, ready, missing_has):
    async def blob(service, npub_override=None):
        return stored, ""

    async def courier():
        return None

    monkeypatch.setattr(server.runtime, "_load_vault_blob", blob)
    monkeypatch.setattr(server.runtime, "courier", courier)
    status = await server.runtime.patron_onboarding_status(NPUB)
    assert status["ready"] is ready
    if missing_has:
        assert missing_has in {m["field"] for m in status["missing"]}


async def test_an_unread_vault_is_never_called_ready_or_absent(monkeypatch):
    async def blob(service, npub_override=None):
        return {}, "vault_bootstrapping"

    async def courier():
        return None

    monkeypatch.setattr(server.runtime, "_load_vault_blob", blob)
    monkeypatch.setattr(server.runtime, "courier", courier)
    status = await server.runtime.patron_onboarding_status(NPUB)
    assert status["ready"] is False
    assert {m["status"] for m in status["missing"]} == {"unknown"}
