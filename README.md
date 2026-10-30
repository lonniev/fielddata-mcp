# FieldData MCP

What your own ground actually measured.
FieldData reads a grower's weather station and soil probes through the vendor's cloud API, under the grower's own keys.
Every reading comes back in one shape, in SI units and UTC, whatever station made it.
It is a DPYC™ Tollbooth operator: patrons pay per call in sats from a pre-funded balance.

The web app at https://fielddata.tollbooth-dpyc.com reads the same tools as a panel of instruments.

Good Earth is its first consumer.
Good Earth projects what a block of ground should do; FieldData reports what it did.
The two share no code; the contract between them is `fielddata_summary`.

## Tools

| Tool | Answers |
| --- | --- |
| `fielddata_list_stations` | Your stations, and the sensors and channels each one reports |
| `fielddata_current` | A station's latest readings, optionally one `sensor_kind` |
| `fielddata_history` | Readings over a time range at 5min, 30min, 4hour or 1day, one series per sensor |
| `fielddata_summary` | Per local day: air temperature min, max and mean, frost hours, rain, degree-days above `base_c` |

A station is named by its `station_id`, its name, or a part of its name only it has.
With one station, leave it empty.

Every reading:

```json
{
  "station_id":   "stable fielddata id",
  "vendor":       "ecowitt",
  "sensor_kind":  "air_temperature | relative_humidity | pressure | wind_speed | wind_direction | rain_rate | rain_total | solar_radiation | uv_index | soil_moisture | soil_temperature | leaf_wetness",
  "channel":      "1..16 or null",
  "channel_name": "null for now",
  "quantity":     0.0,
  "unit":         "°C | % | hPa | m/s | deg | mm | mm/h | W/m² | index",
  "observed_at":  "2026-10-29T06:00:00Z"
}
```

`vendor` is informational; nothing else names one.

## Stations it reads

| Vendor | Status | Patron keys |
| --- | --- | --- |
| Ecowitt (every gateway, the 4G WittField included, via Ecowitt.net v3) | v1 | `ecowitt_application_key`, `ecowitt_api_key` |
| Ambient Weather (via ambientweather.net) | v1 | `ambient_application_key`, `ambient_api_key` |
| Nearby stations their owners publish (Ambient Weather today), chosen by the patron, no keys needed | v1 | none |
| Tempest | planned | personal access token |

## Design rules

1. Pass-through. Nothing is stored beyond a one-minute cache; the patron's data stays theirs.
2. The cache matches the vendor's own refresh, sparing the patron's vendor quota.
3. Patrons bring their own vendor keys by Secure Courier. The operator holds no vendor account.
4. Tool names and reading fields never name a vendor.
5. A vendor failure raises, so the fare is refunded.

## What you're building

```
      YOU (operator, human in the loop)
        │                         │
        │ set & tune prices       │ drive credential intake
        ▼                         ▼
  ┌───────────────┐        ┌──────────────────────────────────────────────┐
  │ Pricing Studio│ prices │        FieldData — YOUR OPERATOR MCP          │
  │    (iOS)      ├───────▶│        FastMCP · deployed on Horizon          │
  └───────────────┘  Neon  │  ┌────────────────────────────────────────┐  │
                           │  │ readings + vendor adapters ◀─ patron keys│ │
   Patron (Citizen)        │  │ @runtime.paid_tool(FROZEN_UUID) tools   │  │
   + MCP client  ─────────▶│  ├────────────────────────────────────────┤  │
   (Claude, Good Earth)    │  │ tollbooth-dpyc SDK (the wheel)          │  │
                    +sats  │  │  ledger · vault (AES-256-GCM) · pricing │  │
                           │  │  /ConstraintGate · Secure Courier·audit │  │
                           │  └────────────────────────────────────────┘  │
                           └───┬─────────┬──────────┬───────────┬─────────┘
                               ▼         ▼          ▼           ▼
                         Neon Postgres  BTCPay▶  Sponsor     Nostr relays
                         (your schema)  Lightning Authority   proofs·courier
                         ledger+pricing invoices  certify +    DMs·audit
                                                  provision
                         Ecowitt.net, ambientweather.net ◀── the patron's own keys
```

### Onboarding roadmap

1. Generate the operator's Nostr keypair; set `TOLLBOOTH_NOSTR_OPERATOR_NSEC`.
2. Request adoption by a sponsor Authority; it provisions the Neon schema.
3. Deliver `btcpay_host`, `btcpay_api_key`, `btcpay_store_id` via `fielddata_request_credential_channel`.
4. Set prices in Pricing Studio — the four field tools start unpriced.
5. Deploy on Horizon (`fastmcp.json`).

Prices live in Neon, never in code.
Get [Pricing Studio](https://github.com/lonniev/tollbooth-pricing-studio) to set them: per-tool, surge, happy-hour, loyalty and free trials.

## Develop

```bash
uv venv --python 3.12 && uv pip install -e ".[dev]"
ruff check .
pytest
python -m fielddata_mcp.server
```

Tests run against the example responses in Ecowitt's API docs and responses built from Ambient Weather's published field list (`tests/fixtures/`).
The live regression fixture is a GW1200 gateway with one WH51 soil probe.

## License

Apache-2.0
