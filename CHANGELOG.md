# Changelog

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Changes not yet released live in `changelog.d/`, one file per change — see the README there for why, and `scripts/changelog.py` for what folds them in at release time.

## [0.2.7] — 2026-11-26

### Changed

- Runs on tollbooth-dpyc 0.131.1: patrons can sign in with a NIP-05 address (name@domain), and a mistyped one says which part to check.

## [0.2.6] — 2026-11-26

### Fixed

- Sign-in takes a NIP-05 address (name@domain) as well as an npub or nsec (@tollbooth-dpyc/web 4.2.2).

## [0.2.5] — 2026-11-25

### Changed

- Refreshed dependencies (Renovate lock-file maintenance and package updates).

## [0.2.4] — 2026-11-22

### Changed

- Runs on tollbooth-dpyc 0.129.0, which lets an operator ask its own human by Nostr DM to fund an outside account that ran dry.

## [0.2.3] — 2026-11-21

### Changed

- llms.txt opens with what to tell a person about FieldData, and describes what it answers in place of a list of tools.

## [0.2.2] — 2026-11-20

### Changed

- The Profile page now sits in folding groups — You, Money, This site, Operator, About — with each group's panels side by side in a grid.

## [0.2.1] — 2026-11-19

### Changed

- The MCP Registry listing carries a title (FieldData) and a link to https://fielddata.tollbooth-dpyc.com, and an icon.

## [0.2.0] — 2026-11-19

### Added

- The Ambient Weather adapter can read public stations inside a lat/lon box, each with its location and latest readings. No tool offers this yet.

- Ambient Weather stations: bring your ambientweather.net keys, on their own or beside your Ecowitt keys, and every tool and page reads them the same way.

- FieldData joins the DPYC Software Factory and gains an MCP Registry manifest, which publishes on the next tagged release.

- The site's look: a drawn vineyard, field and kitchen garden with robots and sensors behind every page, words on cards across the full width, and top-ups as farm-stand coupons beside "Need a wallet?".
- A Sources page and Terms, both in the top navigation.
- A Catalog that reads the Good Brew café's collections live and sends orders to the café.
- `fielddata_summary` takes `sort_col`, `sort_dir`, `page` and `page_size`, and the Log sorts and pages through it.
- The Panel shows every instrument on a made-up farm, plainly marked as illustrative, until a station reports; a stranger can open it without signing in.

- FieldData reads a grower's own Ecowitt station and soil probes through Ecowitt.net, under the grower's own keys, and returns every reading in SI units and UTC: `fielddata_list_stations`, `fielddata_current`, `fielddata_history` and `fielddata_summary` (daily temperature, frost hours, rain and degree-days above a caller's base).

- Find on map: nearby stations and your place show on a map. Tap the ground to set your place, and tap a station to add or remove it.

- A web app at fielddata.tollbooth-dpyc.com: your stations as a panel of instruments, a daily log, and the shared sign-in, profile, wallet, prices and tours.

- Your Profile connects, replaces and removes each station account's keys.
- Your Profile lists stations published near a place, and a ticked one joins your stations like any other; `fielddata_nearby_stations` and the `chosen_stations` property do the same for agents.
- The account menu floats over the page and leaves the bar's height alone.

- The Panel shows two times: when you read the station, and when the station observed what it reports.

- FieldData reads in English, French, Spanish, Japanese, Chinese and Hindi. A guest starts in their country's language; the chooser is on Profile beside Units. The shared web package does the translating; FieldData supplies only its words. The Terms of Use stay in English.

### Changed

- Hindi addresses the reader informally (तुम), like French, Spanish and Chinese, and Japanese drops a redundant あなた; quotations keep their own words.

- Profile opens with your balance, top-up and wallet on the left and your Nostr profile on the right.
- Terms now explains the words the site uses, with a search, and terms of use moved to their own page.
- The Catalog offers Terroir, MCPs, DPYC merchandise and Books.
- The Terroir picture is behind every page, in place of the drawn scene.
- Instrument icons and captions are larger, and a short last row of dials is centered.
- Choosing US units now changes every figure on the site, including the log's base temperature, distances and the words on Terms and Sources.

- A word's definition now also closes by itself once there has been time to read it, from the shared web package's `Term`. The café shelf reads through the package's reader.

- Each page loads the first time it opens, so the first visit downloads about a third less.

- The Panel keeps its last reading while you visit other pages, and reads anew behind it when you return.
- The Panel no longer flashes the sample instruments while your stations load.
- While the Panel finds or reads your stations, it shows quotations on weather and climate.

- `/llms.txt` is built by the shared `@tollbooth-dpyc/web/agent-guide` plugin from this service's own sections, so its connecting, payments, license and links sections match the rest of the fleet.

- The Terms of use page draws its shared sections (your key, fees, the café, marks) from the web package, and the sign-in card links to it.

- The wallet is now the shared one from tollbooth-web 3.0.0, with farm-stand tiles, a QR code on an open invoice, and smaller amounts.

- The tutorial now walks the wallet page, including paying from Strike or Cash App, and covers picking among your connected and nearby stations.

### Fixed

- The Catalog reads the café on the deployed site: its proxy now names itself to the store, which refuses a request with no User-Agent.

- A chosen station reads correctly for a patron who also holds keys for that vendor, and one station that will not read no longer breaks the list or the Profile page.

- Pages use more of a wide screen: the page grows to 90rem (it stopped at 80rem), and the sign-in card no longer stops partway across.

- Keys take effect as soon as they are delivered, updated or deleted, in place of up to 15 minutes later.

- Every chosen station now shows on Profile and can be removed, including one that is not answering, and the panel links to where stations are added or removed.

- Profile's wallet and Sponsorship cards line up with its other cards.
