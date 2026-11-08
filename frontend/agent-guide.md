FieldData is a web app at https://fielddata.tollbooth-dpyc.com and an MCP server that AI assistants can call.
Every reading is in SI units and UTC, whatever station made it.

## Bring your own station keys

Your stations stay on your own vendor account, and FieldData reads them with your keys.
It reads Ecowitt and Ambient Weather stations, and you may connect either account or both.
Keys arrive as an encrypted Nostr direct message and are stored encrypted.
Stations are found from your account; you never type one in.

## What it answers

- `fielddata_list_stations` names your stations and the sensors each one reports.
- `fielddata_current` gives a station's latest readings.
- `fielddata_history` gives readings over a time range.
- `fielddata_summary` gives daily temperature, frost hours, rain and degree-days.
- `fielddata_nearby_stations` finds stations whose owners publish them near a place.

## Pages

`/` `/how` `/prices` `/catalog` `/sources` `/terms`

The Catalog shows the Good Brew café's collections, read live from https://cafe.tollbooth-dpyc.com; orders are placed at the café.
