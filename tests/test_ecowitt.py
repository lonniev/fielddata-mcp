"""The Ecowitt v3 adapter, against the example responses in Ecowitt's own API docs."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path

import httpx
import pytest
import respx

from fielddata_mcp import ecowitt
from fielddata_mcp.readings import SENSOR_KINDS, UNITS, Station, station_id_for

FIXTURES = Path(__file__).parent / "fixtures"
BASE = "https://api.ecowitt.net/api/v3"
KEYS = ecowitt.EcowittKeys(application_key="APPKEY-SECRET-123", api_key="APIKEY-SECRET-456")


def fixture(name: str) -> dict:
    return json.loads((FIXTURES / name).read_text())


def station(zone: str = "UTC") -> Station:
    return Station(
        station_id=station_id_for("ecowitt", "25:25:25:25:25:25"),
        vendor="ecowitt",
        name="Lower field",
        timezone=zone,
        latitude=None,
        longitude=None,
        model="GW1200",
        device_ref={"mac": "25:25:25:25:25:25"},
    )


def by_kind(readings, kind, channel=None):
    return [r for r in readings if r.sensor_kind == kind and r.channel == channel]


# ---------------------------------------------------------------------------
# Stations
# ---------------------------------------------------------------------------


@respx.mock
async def test_list_stations_reads_mac_and_imei_devices():
    respx.get(f"{BASE}/device/list").mock(return_value=httpx.Response(200, json=fixture("device-list.json")))

    stations = await ecowitt.list_stations(KEYS)

    assert [s.name for s in stations] == ["ceshi", "test1"]
    assert stations[0].device_ref == {"mac": "25:25:25:25:25:25"}
    assert stations[1].device_ref == {"imei": "863879049793071"}
    assert stations[0].timezone == "Australia/Melbourne"
    assert stations[0].station_id == station_id_for("ecowitt", "25:25:25:25:25:25")


@respx.mock
async def test_list_stations_follows_every_page():
    page = fixture("device-list.json")
    first = json.loads(json.dumps(page))
    first["data"].update(totalPage=2, list=page["data"]["list"][:1])
    second = json.loads(json.dumps(page))
    second["data"].update(totalPage=2, pageNum=2, list=page["data"]["list"][1:])
    route = respx.get(f"{BASE}/device/list").mock(side_effect=[
        httpx.Response(200, json=first), httpx.Response(200, json=second),
    ])

    stations = await ecowitt.list_stations(KEYS)

    assert len(stations) == 2
    assert route.calls[1].request.url.params["page"] == "2"


def test_station_id_is_stable_and_names_no_vendor_handle():
    a = station_id_for("ecowitt", "25:25:25:25:25:25")
    assert a == station_id_for("ecowitt", "25:25:25:25:25:25")
    assert a != station_id_for("ecowitt", "26:26:26:26:26:26")
    assert "25:25" not in a and "ecowitt" not in a


# ---------------------------------------------------------------------------
# Real time
# ---------------------------------------------------------------------------


@respx.mock
async def test_real_time_asks_for_si_units():
    route = respx.get(f"{BASE}/device/real_time").mock(
        return_value=httpx.Response(200, json=fixture("real-time.json")),
    )

    await ecowitt.real_time(KEYS, station())

    params = route.calls[0].request.url.params
    assert params["mac"] == "25:25:25:25:25:25"
    assert params["temp_unitid"] == "1"
    assert params["pressure_unitid"] == "3"
    assert params["wind_speed_unitid"] == "6"
    assert params["rainfall_unitid"] == "12"
    assert params["solar_irradiance_unitid"] == "16"


@respx.mock
async def test_real_time_converts_imperial_answers_to_si():
    """The doc example is imperial; whatever arrives must leave in SI."""
    respx.get(f"{BASE}/device/real_time").mock(return_value=httpx.Response(200, json=fixture("real-time.json")))

    readings = await ecowitt.real_time(KEYS, station())

    assert by_kind(readings, "air_temperature")[0].quantity == pytest.approx((127.7 - 32) * 5 / 9, abs=0.01)
    assert by_kind(readings, "pressure")[0].quantity == pytest.approx(26.34 * 33.8639, abs=0.01)
    assert by_kind(readings, "wind_speed")[0].quantity == pytest.approx(46.9 * 0.44704, abs=0.001)
    assert by_kind(readings, "rain_rate")[0].quantity == pytest.approx(242.56 * 25.4, abs=0.01)
    assert by_kind(readings, "rain_total")[0].quantity == pytest.approx(332.69 * 25.4, abs=0.01)
    assert by_kind(readings, "wind_direction")[0].quantity == 267
    assert by_kind(readings, "solar_radiation")[0].quantity == 101.8
    for reading in readings:
        assert reading.unit == UNITS[reading.sensor_kind]
        assert reading.sensor_kind in SENSOR_KINDS


@respx.mock
async def test_real_time_reads_soil_and_leaf_channels():
    respx.get(f"{BASE}/device/real_time").mock(return_value=httpx.Response(200, json=fixture("real-time.json")))

    readings = await ecowitt.real_time(KEYS, station())

    assert by_kind(readings, "soil_moisture", 1)[0].quantity == 79
    assert by_kind(readings, "soil_moisture", 2)[0].quantity == 19
    assert by_kind(readings, "soil_temperature", 1)[0].quantity == pytest.approx((64.3 - 32) * 5 / 9, abs=0.01)
    assert by_kind(readings, "leaf_wetness", 1)[0].quantity == 73
    assert by_kind(readings, "soil_moisture", 1)[0].observed_at == datetime.fromtimestamp(1645596032, tz=UTC)


@respx.mock
async def test_real_time_prefers_outdoor_and_ignores_unmapped_groups():
    respx.get(f"{BASE}/device/real_time").mock(return_value=httpx.Response(200, json=fixture("real-time.json")))

    readings = await ecowitt.real_time(KEYS, station())

    temps = by_kind(readings, "air_temperature")
    assert len(temps) == 1  # outdoor only; indoor stands in only when outdoor is absent
    assert len(by_kind(readings, "rain_total")) == 1  # gauge, not piezo as well
    assert {r.vendor for r in readings} == {"ecowitt"}


def test_gateway_alone_reports_its_built_in_sensor():
    """A GW1200 with nothing paired answers only `indoor`; that is its air reading."""
    data = {"indoor": {"temperature": {"time": "1645596032", "unit": "℃", "value": "18.5"},
                       "humidity": {"time": "1645596032", "unit": "%", "value": "61"}},
            "pressure": {"relative": {"time": "1645596032", "unit": "hPa", "value": "1013.2"}}}

    readings = ecowitt.normalize(data, station(), history=False)

    assert by_kind(readings, "air_temperature")[0].quantity == 18.5
    assert by_kind(readings, "relative_humidity")[0].quantity == 61
    assert by_kind(readings, "pressure")[0].quantity == 1013.2


def test_piezo_gauge_stands_in_when_there_is_no_traditional_one():
    data = {"rainfall_piezo": {"daily": {"time": "1645596032", "unit": "mm", "value": "4.2"}}}

    readings = ecowitt.normalize(data, station(), history=False)

    assert by_kind(readings, "rain_total")[0].quantity == 4.2


def test_unknown_units_and_blank_values_are_skipped():
    data = {"outdoor": {"temperature": {"time": "1645596032", "unit": "K", "value": "290"},
                        "humidity": {"time": "1645596032", "unit": "%", "value": "--"}},
            "solar_and_uvi": {"solar": {"time": "1645596032", "unit": "lux", "value": "5000"}}}

    assert ecowitt.normalize(data, station(), history=False) == []


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------


@respx.mock
async def test_history_sends_local_times_and_trims_to_the_utc_window():
    route = respx.get(f"{BASE}/device/history").mock(
        return_value=httpx.Response(200, json=fixture("history.json")),
    )
    # The fixture's points sit at 1647993600 … 1648166400 (2022-03-23 00:00Z … 03-25 00:00Z).
    start = datetime(2022, 3, 23, 0, 0, tzinfo=UTC)
    end = datetime(2022, 3, 24, 0, 0, tzinfo=UTC)

    readings = await ecowitt.history(
        KEYS, station("America/New_York"), start, end, "30min", frozenset({"soil_moisture"}),
    )

    params = route.calls[0].request.url.params
    assert params["start_date"] == "2022-03-22 20:00:00"
    assert params["end_date"] == "2022-03-23 20:00:00"
    assert params["cycle_type"] == "30min"
    assert set(params["call_back"].split(",")) == {f"soil_ch{n}" for n in range(1, 17)}
    assert {r.sensor_kind for r in readings} == {"soil_moisture"}
    assert all(start <= r.observed_at <= end for r in readings)
    assert sorted({r.channel for r in readings}) == [1, 2]
    assert len(by_kind(readings, "soil_moisture", 1)) == 4  # 03-23 00:00, 04:00, 08:00 and 03-24 00:00


@respx.mock
async def test_history_converts_series_to_si():
    respx.get(f"{BASE}/device/history").mock(return_value=httpx.Response(200, json=fixture("history.json")))
    start = datetime(2022, 3, 23, tzinfo=UTC)
    end = datetime(2022, 3, 26, tzinfo=UTC)

    readings = await ecowitt.history(KEYS, station(), start, end, "4hour", frozenset({"air_temperature"}))

    first = min(by_kind(readings, "air_temperature"), key=lambda r: r.observed_at)
    assert first.quantity == pytest.approx((44.3 - 32) * 5 / 9, abs=0.01)
    assert first.unit == "°C"


# ---------------------------------------------------------------------------
# Failures never carry the keys
# ---------------------------------------------------------------------------


@respx.mock
async def test_rejected_key_is_named_and_carries_no_secret():
    respx.get(f"{BASE}/device/list").mock(
        return_value=httpx.Response(200, json={"code": 40011, "msg": "Illegal Api_Key Parameter", "data": {}}),
    )

    with pytest.raises(ecowitt.EcowittError) as caught:
        await ecowitt.list_stations(KEYS)

    assert caught.value.rejects_keys
    assert "API Key" in str(caught.value)
    assert "SECRET" not in str(caught.value)


@respx.mock
async def test_network_failure_hides_the_url():
    respx.get(f"{BASE}/device/real_time").mock(side_effect=httpx.ConnectError("boom for url with APIKEY-SECRET-456"))

    with pytest.raises(ecowitt.EcowittError) as caught:
        await ecowitt.real_time(KEYS, station())

    assert "SECRET" not in str(caught.value)
    assert caught.value.__cause__ is None
    assert caught.value.__suppress_context__


@respx.mock
async def test_http_error_and_non_json_are_named():
    respx.get(f"{BASE}/device/real_time").mock(side_effect=[
        httpx.Response(502, text="bad gateway"),
        httpx.Response(200, text="<html>nope</html>"),
    ])

    with pytest.raises(ecowitt.EcowittError, match="HTTP 502"):
        await ecowitt.real_time(KEYS, station())
    with pytest.raises(ecowitt.EcowittError, match="not JSON"):
        await ecowitt.real_time(KEYS, station())


def test_keys_never_appear_in_repr():
    assert "SECRET" not in repr(KEYS)
    assert "25:25" not in repr(station())
