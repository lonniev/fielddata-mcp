"""The Ambient Weather adapter, against responses built from Ambient's published field list."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from itertools import pairwise
from pathlib import Path

import httpx
import pytest
import respx

from fielddata_mcp import ambient
from fielddata_mcp.readings import SENSOR_KINDS, UNITS, VendorError, station_id_for

DEVICES = json.loads((Path(__file__).parent / "fixtures" / "ambient-devices.json").read_text())
BASE = "https://rt.ambientweather.net/v1"
KEYS = ambient.AmbientKeys(application_key="APPKEY-SECRET-123", api_key="APIKEY-SECRET-456")
MAC = "00:0E:C6:00:00:01"
HISTORY_URL = f"{BASE}/devices/00%3A0E%3AC6%3A00%3A00%3A01"
FULL = frozenset(SENSOR_KINDS)


@pytest.fixture(autouse=True)
def no_waiting(monkeypatch):
    waits = []

    async def sleep(seconds):
        waits.append(seconds)

    monkeypatch.setattr(ambient.asyncio, "sleep", sleep)
    return waits


def station():
    return ambient._station(DEVICES[0])


def value(readings, kind, channel=None):
    return next(r.quantity for r in readings if r.sensor_kind == kind and r.channel == channel)


def ms(moment):
    return int(moment.timestamp() * 1000)


@respx.mock
async def test_list_stations_finds_each_device_with_an_address():
    respx.get(f"{BASE}/devices").mock(return_value=httpx.Response(200, json=DEVICES))
    found = await ambient.list_stations(KEYS)
    assert [s.name for s in found] == ["Vineyard", "00:0E:C6:00:00:02"]
    first = found[0]
    assert first.station_id == station_id_for("ambient", MAC)
    assert first.vendor == "ambient"
    assert first.timezone == "America/New_York"
    assert (first.latitude, first.longitude) == (44.26, -72.57)
    assert found[1].timezone == "UTC"


@respx.mock
async def test_keys_go_in_the_query_under_ambients_own_names():
    route = respx.get(f"{BASE}/devices").mock(return_value=httpx.Response(200, json=DEVICES))
    await ambient.list_stations(KEYS)
    params = route.calls[0].request.url.params
    assert params["applicationKey"] == "APPKEY-SECRET-123"
    assert params["apiKey"] == "APIKEY-SECRET-456"


@respx.mock
async def test_real_time_converts_every_field_to_si():
    respx.get(f"{BASE}/devices").mock(return_value=httpx.Response(200, json=DEVICES))
    readings = await ambient.real_time(KEYS, station())
    assert value(readings, "air_temperature") == 10.0
    assert value(readings, "relative_humidity") == 64
    assert value(readings, "pressure") == pytest.approx(1015.917)
    assert value(readings, "wind_speed") == pytest.approx(4.47)
    assert value(readings, "wind_direction") == 292
    assert value(readings, "rain_rate") == pytest.approx(2.54)
    assert value(readings, "rain_total") == pytest.approx(12.7)
    assert value(readings, "solar_radiation") == 420.5
    assert value(readings, "uv_index") == 4
    assert value(readings, "soil_moisture", 1) == 34
    assert value(readings, "soil_moisture", 3) == 41
    assert value(readings, "soil_temperature", 1) == 15.0
    assert value(readings, "leaf_wetness", 2) == 18
    assert all(r.unit == UNITS[r.sensor_kind] and r.vendor == "ambient" for r in readings)
    assert {r.observed_at for r in readings} == {datetime(2026, 10, 30, 14, tzinfo=UTC)}


@respx.mock
async def test_an_extra_sensor_is_never_taken_for_air_temperature():
    respx.get(f"{BASE}/devices").mock(return_value=httpx.Response(200, json=DEVICES))
    readings = await ambient.real_time(KEYS, station())
    assert [r.quantity for r in readings if r.sensor_kind == "air_temperature"] == [10.0]


@respx.mock
async def test_a_console_with_no_outdoor_sensor_stands_in_and_a_null_is_skipped():
    respx.get(f"{BASE}/devices").mock(return_value=httpx.Response(200, json=DEVICES))
    bare = ambient._station(DEVICES[1])
    readings = await ambient.real_time(KEYS, bare)
    assert value(readings, "air_temperature") == 20.0
    assert value(readings, "relative_humidity") == 45
    assert not [r for r in readings if r.sensor_kind == "pressure"]


@respx.mock
async def test_real_time_for_a_device_no_longer_on_the_account():
    respx.get(f"{BASE}/devices").mock(return_value=httpx.Response(200, json=DEVICES[1:]))
    with pytest.raises(VendorError, match="does not know"):
        await ambient.real_time(KEYS, station())


def rows_back_from(end, count, minutes=5):
    return [
        {"dateutc": ms(end - timedelta(minutes=minutes * i)), "tempf": 32.0 + i % 3, "dailyrainin": 0.1}
        for i in range(count)
    ]


@respx.mock
async def test_history_pages_back_a_second_apart_until_it_passes_the_start(no_waiting):
    end = datetime(2026, 10, 30, tzinfo=UTC)
    start = end - timedelta(days=2)
    first = rows_back_from(end, 288)
    second = rows_back_from(end - timedelta(days=1), 288)
    third = rows_back_from(end - timedelta(days=2), 288)
    route = respx.get(HISTORY_URL).mock(side_effect=[
        httpx.Response(200, json=first), httpx.Response(200, json=second), httpx.Response(200, json=third),
    ])
    readings = await ambient.history(KEYS, station(), start, end, "5min", frozenset({"air_temperature"}))
    assert route.call_count == 3
    assert no_waiting == [ambient._REQUEST_GAP_SECONDS] * 2
    params = route.calls[1].request.url.params
    assert int(params["endDate"]) == first[-1]["dateutc"] - 1
    assert params["limit"] == "288"
    assert all(start <= r.observed_at <= end for r in readings)
    assert {r.sensor_kind for r in readings} == {"air_temperature"}
    assert readings == sorted(readings, key=lambda r: r.observed_at)


@respx.mock
async def test_history_thins_so_a_sample_stands_for_its_step_on_any_device():
    end = datetime(2026, 10, 30, 12, tzinfo=UTC)
    start = end - timedelta(hours=3)
    respx.get(HISTORY_URL).mock(return_value=httpx.Response(200, json=rows_back_from(end, 37)))
    five = await ambient.history(KEYS, station(), start, end, "5min", frozenset({"air_temperature"}))
    thirty = await ambient.history(KEYS, station(), start, end, "30min", frozenset({"air_temperature"}))
    assert len(five) == 37
    assert len(thirty) == 7
    gaps = {(b.observed_at - a.observed_at) for a, b in pairwise(thirty)}
    assert gaps == {timedelta(minutes=30)}


@respx.mock
async def test_history_stops_on_an_empty_page_and_when_time_does_not_advance():
    end = datetime(2026, 10, 30, tzinfo=UTC)
    start = end - timedelta(days=5)
    route = respx.get(HISTORY_URL).mock(return_value=httpx.Response(200, json=[]))
    assert await ambient.history(KEYS, station(), start, end, "5min", FULL) == []
    assert route.call_count == 1

    stuck = respx.get(HISTORY_URL).mock(return_value=httpx.Response(200, json=[{"dateutc": ms(end), "tempf": 40}]))
    await ambient.history(KEYS, station(), start, end, "5min", FULL)
    assert stuck.call_count == 2


@respx.mock
async def test_a_429_waits_and_retries(no_waiting):
    route = respx.get(f"{BASE}/devices").mock(side_effect=[
        httpx.Response(429), httpx.Response(200, json=DEVICES),
    ])
    assert len(await ambient.list_stations(KEYS)) == 2
    assert route.call_count == 2
    assert no_waiting == [ambient._REQUEST_GAP_SECONDS]


@respx.mock
async def test_a_429_that_will_not_clear_says_busy():
    route = respx.get(f"{BASE}/devices").mock(return_value=httpx.Response(429))
    with pytest.raises(VendorError, match="busy"):
        await ambient.list_stations(KEYS)
    assert route.call_count == ambient._ATTEMPTS


@pytest.mark.parametrize("status", [401, 403])
@respx.mock
async def test_refused_keys_are_named_as_such(status):
    respx.get(f"{BASE}/devices").mock(return_value=httpx.Response(status, json={"error": "apiKey-invalid"}))
    with pytest.raises(VendorError) as caught:
        await ambient.list_stations(KEYS)
    assert caught.value.rejects_keys


@pytest.mark.parametrize("response", [
    httpx.Response(500),
    httpx.Response(200, text="not json"),
    httpx.Response(200, json={"not": "a list"}),
])
@respx.mock
async def test_no_failure_carries_a_key_or_a_url(response):
    respx.get(f"{BASE}/devices").mock(return_value=response)
    with pytest.raises(VendorError) as caught:
        await ambient.list_stations(KEYS)
    assert "SECRET" not in str(caught.value) and "http" not in str(caught.value).lower().replace("http 500", "")
    assert not caught.value.rejects_keys


@respx.mock
async def test_a_network_failure_carries_no_key_or_url():
    respx.get(f"{BASE}/devices").mock(side_effect=httpx.ConnectError(f"{BASE}/devices?apiKey=APIKEY-SECRET-456"))
    with pytest.raises(VendorError) as caught:
        await ambient.list_stations(KEYS)
    assert "SECRET" not in str(caught.value)
    assert caught.value.__cause__ is None


def test_keys_stay_out_of_repr():
    assert "SECRET" not in repr(KEYS)


def test_the_mac_stays_out_of_what_a_tool_shows():
    assert MAC not in str(station().as_dict())
