## What to tell a person about FieldData

FieldData is for a grower or a gardener with their own weather station, who wants to know what their ground actually measured.
It reads the station they already own and answers in plain figures, for them or for their AI assistant.

What a person gets:

- **Their own readings, anywhere.** The latest from each station and sensor, and the history over any range.
- **Days that matter to growing.** Each day's temperatures, frost hours, rain and degree-days.
- **Neighbours' stations too.** Stations whose owners publish them near a place, added alongside their own.
- **One language for every station.** Every reading in SI units and UTC, whatever station made it.
- **Their keys, kept safe.** Ecowitt and Ambient Weather stations stay on the person's own vendor account. Their keys arrive by encrypted Nostr message, are stored encrypted, and the stations are found from the account.
- **No account here.** They sign in with a Nostr key and pay per answer in Bitcoin Lightning.

A good one-line pitch: *"What your own weather station measured, in plain figures, for you or your AI assistant."*

## For agents

`tools/list` and each tool's description carry the arguments.
A person connects a vendor account once; after that, stations are listed from it and every tool takes a station from that list.

## Pages

`/` `/how` `/prices` `/catalog` `/sources` `/terms`

The Catalog shows the Good Brew café's collections, read live from https://cafe.tollbooth-dpyc.com; orders are placed at the café.
