/**
 * Every word FieldData's own pages say, in English: the bedrock the other
 * languages translate.
 *
 * Keys are "<area>.<file>.<name>" (areas: views, ui, lib). A `{{name}}` is
 * filled with a word or number; a `<name/>` or `<name>…</name>` is drawn as an
 * element. A translation keeps each one exactly as written and may move it.
 * "FieldData", vendor names, units and emoji stay as they are.
 */

export const en = {
  // ── lib/answered ──────────────────────────────────────────────────────────
  "lib.answered.refused": "The service refused that request.",

  // ── lib/glossary: the Terms page and every inline definition ─────────────
  "lib.glossary.group.instruments": "Instruments",
  "lib.glossary.group.readings": "Readings",
  "lib.glossary.group.arithmetic": "The log's arithmetic",
  "lib.glossary.group.account": "Your account",
  // Each `.aka` is a list of other names a reader may search by, kept apart by " · ". Keep the " · " between them.
  "lib.glossary.air_temperature.term": "Thermometer",
  "lib.glossary.air_temperature.aka": "air temperature",
  "lib.glossary.air_temperature.said": "Measures the temperature of the air around the station's sensor, which is usually sheltered from direct sun.",
  "lib.glossary.pressure.term": "Barometer",
  "lib.glossary.pressure.aka": "barometric pressure · relative pressure",
  "lib.glossary.pressure.said": "Measures the weight of the air above the station, adjusted to sea level so places can be compared. A falling barometer often comes before unsettled weather.",
  "lib.glossary.relative_humidity.term": "Hygrometer",
  "lib.glossary.relative_humidity.aka": "relative humidity",
  "lib.glossary.relative_humidity.said": "Measures how much water the air holds, as a share of the most it could hold at that temperature.",
  "lib.glossary.wind_speed.term": "Anemometer",
  "lib.glossary.wind_speed.aka": "wind speed",
  "lib.glossary.wind_speed.said": "Measures how fast the air is moving, usually from a set of spinning cups.",
  "lib.glossary.wind_direction.term": "Wind vane",
  "lib.glossary.wind_direction.aka": "wind direction",
  "lib.glossary.wind_direction.said": "Shows the direction the wind is blowing from, so a west wind comes out of the west.",
  "lib.glossary.rain_total.term": "Rain gauge",
  "lib.glossary.rain_total.aka": "rainfall · rain total",
  "lib.glossary.rain_total.said": "Measures how much rain has fallen, as the depth it would reach on flat ground. The figure here is the running total for the day.",
  "lib.glossary.rain_rate.term": "Rain rate",
  "lib.glossary.rain_rate.aka": "rainfall rate",
  "lib.glossary.rain_rate.said": "How hard it is raining right now, as the depth that would fall in an hour at this pace.",
  "lib.glossary.solar_radiation.term": "Pyranometer",
  "lib.glossary.solar_radiation.aka": "solar radiation · irradiance · W/m²",
  "lib.glossary.solar_radiation.said": "Measures the sunlight reaching the sensor, as power on each square meter of ground.",
  "lib.glossary.uv_index.term": "UV index",
  "lib.glossary.uv_index.aka": "UV · ultraviolet",
  "lib.glossary.uv_index.said": "A scale for the sunburning strength of the sun's ultraviolet light. Higher means skin burns sooner.",
  "lib.glossary.soil_moisture.term": "Soil moisture",
  "lib.glossary.soil_moisture.aka": "soil humidity",
  "lib.glossary.soil_moisture.said": "How wet the soil is around a buried probe. The percentage is the probe's own scale, so it is best read against the same probe on other days.",
  "lib.glossary.soil_temperature.term": "Soil temperature",
  "lib.glossary.soil_temperature.said": "The temperature of the ground around a probe. Seeds and roots respond to it more than to the air.",
  "lib.glossary.leaf_wetness.term": "Leaf wetness",
  "lib.glossary.leaf_wetness.said": "How wet a sensor shaped like a leaf is. Long wet spells on leaves are when many fungal diseases take hold.",
  "lib.glossary.channel.term": "Channel",
  "lib.glossary.channel.aka": "probe number",
  "lib.glossary.channel.said": "The number that tells one sensor from another of the same kind on a station, such as two soil probes.",
  "lib.glossary.gdd.term": "Degree-days",
  "lib.glossary.gdd.aka": "GDD · growing degree days · degree day",
  "lib.glossary.gdd.said": "A day's warmth above the temperature a plant starts growing at: the day's low and high averaged, less that base, and never below zero. They add up through a season, which is why a crop is paced by heat more than by the calendar.",
  "lib.glossary.base_temp.term": "Base temperature",
  "lib.glossary.base_temp.aka": "base",
  // {{corn}} and {{peas}} are temperatures with their unit, such as "50 °F".
  "lib.glossary.base_temp.said": "The temperature below which a plant does no growing. It belongs to the crop: field corn counts from {{corn}} and peas from about {{peas}}.",
  "lib.glossary.frost_hours.term": "Frost hours",
  "lib.glossary.frost_hours.aka": "frost",
  // {{freezing}} is the freezing point with its unit: "32 °F" or "0 °C".
  "lib.glossary.frost_hours.said": "How long the air stayed at or below {{freezing}} that day, added up from the station's half-hour samples.",
  "lib.glossary.station.term": "Station",
  "lib.glossary.station.aka": "gateway · console",
  "lib.glossary.station.said": "A device that reports readings to a vendor's service, with whatever sensors are paired to it.",
  "lib.glossary.nearby_station.term": "Nearby station",
  "lib.glossary.nearby_station.aka": "public station",
  "lib.glossary.nearby_station.said": "A station whose owner publishes it. Once you tick one, it joins your stations.",
  "lib.glossary.keys.term": "Application Key and API Key",
  "lib.glossary.keys.aka": "API key · keys",
  "lib.glossary.keys.said": "The pair your weather vendor issues so a service can read your account. You make them on the vendor's site, and you can delete them there at any time.",
  "lib.glossary.npub.term": "npub",
  "lib.glossary.npub.aka": "Nostr key · Nostr",
  "lib.glossary.npub.said": "Your public identity on Nostr, in place of a username. Its secret half, the nsec, stays with you.",
  "lib.glossary.sats.term": "Sats",
  "lib.glossary.sats.aka": "satoshi · api_sats",
  "lib.glossary.sats.said": "Small units of Bitcoin. FieldData's tool fees are paid from your balance of them.",
  "lib.glossary.lightning.term": "Lightning",
  "lib.glossary.lightning.aka": "Bitcoin Lightning · invoice",
  "lib.glossary.lightning.said": "A network for paying small amounts of Bitcoin quickly. You top up by paying a Lightning invoice from your wallet.",

  // ── lib/instruments: each instrument's name on the panel ─────────────────
  "lib.instruments.name.air_temperature": "Air",
  "lib.instruments.name.wind_speed": "Anemometer",
  "lib.instruments.name.wind_direction": "Wind vane",
  "lib.instruments.name.pressure": "Barometer",
  "lib.instruments.name.relative_humidity": "Hygrometer",
  "lib.instruments.name.rain_total": "Rain gauge",
  "lib.instruments.name.rain_rate": "Rain rate",
  "lib.instruments.name.solar_radiation": "Pyranometer",
  "lib.instruments.name.uv_index": "UV index",
  "lib.instruments.name.soil_temperature": "Soil",
  "lib.instruments.name.soil_moisture": "Soil moisture",
  "lib.instruments.name.leaf_wetness": "Leaf wetness",
  // {{name}} is an instrument; {{channel}} is the name its owner gave the probe, such as "Tomatoes".
  "lib.instruments.named": "{{name}}: {{channel}}",
  // {{channel}} is the probe's number, for a station with several of one kind.
  "lib.instruments.numbered": "{{name}} {{channel}}",
  // The sixteen points of the compass, as short as a compass card prints them.
  "lib.instruments.point.N": "N",
  "lib.instruments.point.NNE": "NNE",
  "lib.instruments.point.NE": "NE",
  "lib.instruments.point.ENE": "ENE",
  "lib.instruments.point.E": "E",
  "lib.instruments.point.ESE": "ESE",
  "lib.instruments.point.SE": "SE",
  "lib.instruments.point.SSE": "SSE",
  "lib.instruments.point.S": "S",
  "lib.instruments.point.SSW": "SSW",
  "lib.instruments.point.SW": "SW",
  "lib.instruments.point.WSW": "WSW",
  "lib.instruments.point.W": "W",
  "lib.instruments.point.WNW": "WNW",
  "lib.instruments.point.NW": "NW",
  "lib.instruments.point.NNW": "NNW",

  // ── lib/preview: the probes on the made-up farm ──────────────────────────
  "lib.preview.vineyard": "Vineyard row 4",
  "lib.preview.kitchenGarden": "Kitchen garden",
  "lib.preview.northField": "North field",

  // ── lib/quotes: quotations shown during a wait ───────────────────────────
  "lib.quotes.badMoon": "Don't go around tonight, well, it's bound to take your life. There's a bad moon on the rise.",
  "lib.quotes.weatherman": "You don't need a weatherman to know which way the wind blows.",
  "lib.quotes.forecast": "Weather forecast for tonight: dark.",
  "lib.quotes.talks": "Everybody talks about the weather, but nobody does anything about it.",
  "lib.quotes.climate": "Climate is what you expect; weather is what you get.",
  "lib.quotes.redSky": "Red sky at night, shepherd's delight; red sky in the morning, shepherd's warning.",
  "lib.quotes.mackerel": "Mackerel sky and mares' tails make lofty ships carry low sails.",
  "lib.quotes.dew": "When the dew is on the grass, rain will never come to pass.",
  "lib.quotes.matthew": "When it is evening, ye say, It will be fair weather: for the sky is red.",
  "lib.quotes.ecclesiastes": "He that observeth the wind shall not sow; and he that regardeth the clouds shall not reap.",
  "lib.quotes.job": "Hast thou entered into the treasures of the snow?",
  "lib.quotes.longfellow": "Into each life some rain must fall.",
  "lib.quotes.proust": "A change in the weather is sufficient to recreate the world and ourselves.",
  // Shown where an author's name would be, for a quotation nobody wrote.
  "lib.quotes.saying": "Saying",
  "lib.quotes.lore": "Weather lore",

  // ── lib/tiles: the names on the top-up tiles, sized like a farm stand ────
  "lib.tiles.seedling": "Seedling",
  "lib.tiles.gardenRow": "Garden Row",
  "lib.tiles.seedPacket": "Seed Packet",
  "lib.tiles.bushelBasket": "Bushel Basket",
  "lib.tiles.fullSilo": "Full Silo",

  // ── lib/tours: the guided tours of FieldData's own pages ─────────────────
  "lib.tours.account.keys.title": "Your station keys",
  "lib.tours.account.keys.says": "Send your station keys by Nostr message, and your stations appear on the panel.",
  "lib.tours.account.nearby.title": "Nearby stations",
  "lib.tours.account.nearby.says": "Tick stations near you, from the list or the map, and they join your own on the panel.",
  "lib.tours.account.units.title": "Units",
  "lib.tours.account.units.says": "Choose metric or US figures for every instrument on this device.",
  "lib.tours.panel.keys.title": "Connect your station",
  "lib.tours.panel.keys.says": "Connect your Ecowitt or Ambient Weather account here, and your stations appear on the panel.",
  "lib.tours.panel.station.title": "The station",
  "lib.tours.panel.station.says": "Pick any station you connected or ticked nearby, and the panel reads it.",
  "lib.tours.panel.deck.title": "Your instruments",
  "lib.tours.panel.deck.says": "Each sensor has its own instrument: tap one to see its last day.",
  "lib.tours.panel.refresh.title": "Read again",
  "lib.tours.panel.refresh.says": "Tap here when you want a fresh reading.",
  "lib.tours.log.range.title": "The period",
  "lib.tours.log.range.says": "Choose your days and the base temperature for degree-days.",
  "lib.tours.log.table.title": "The days",
  "lib.tours.log.table.says": "Each line is one local day at your station: tap a heading to sort.",

  // ── App.tsx: the bars at the top and the foot of every page ──────────────
  "ui.app.welcome": "Your own weather station and soil probes, read as one panel of instruments.",
  "ui.app.nav.panel": "Panel",
  "ui.app.nav.log": "Log",
  "ui.app.nav.wallet": "Wallet",
  "ui.app.nav.catalog": "Catalog",
  "ui.app.nav.sources": "Sources",
  "ui.app.nav.terms": "Terms",
  "ui.app.nav.how": "How it works",
  "ui.app.nav.prices": "Prices",
  "ui.app.nav.profile": "Profile & theme",
  "ui.app.nav.termsOfUse": "Terms of use",
  "ui.app.signIn": "Sign in",
  "ui.app.opening": "Opening the page…",
  // <tb/> is the link "Tollbooth DPYC™".
  "ui.app.monetized": "Monetized with <tb/> · Apache-2.0 · Patent Pending (US Prov. 64/045,999)",
  "ui.app.trademarks": "Ecowitt and Ambient Weather are trademarks of their owners; no affiliation or endorsement is implied. Weather Icons by Erik Flowers, under the SIL OFL 1.1.",

  // ── components/Deck ──────────────────────────────────────────────────────
  // A button's spoken name: {{label}} is an instrument; tapping it opens the instrument's day.
  "ui.deck.trace": "{{label}} trace",

  // ── components/NearbyStations ────────────────────────────────────────────
  "ui.nearbyStations.heading": "Nearby stations",
  "ui.nearbyStations.intro": "Tick a station its owner publishes, and it joins your stations on the panel and for your AI agents. Untick it to remove it.",
  "ui.nearbyStations.noLocation": "This browser cannot give a location: type one in.",
  // {{reason}} is the browser's own explanation.
  "ui.nearbyStations.locationFailed": "The location could not be read: {{reason}}",
  // Stands in for a vendor's name when a saved station's vendor is unknown, as in "Saved station".
  "ui.nearbyStations.saved": "Saved",
  // A station whose name has not arrived: {{vendor}} is a vendor, such as "Ecowitt".
  "ui.nearbyStations.unnamed": "{{vendor}} station",
  "ui.nearbyStations.unnamedNear": "{{vendor}} station near {{latitude}}, {{longitude}}",
  "ui.nearbyStations.latitude": "Latitude",
  "ui.nearbyStations.longitude": "Longitude",
  "ui.nearbyStations.useLocation": "Use my location",
  "ui.nearbyStations.findOnMap": "Find on map",
  // Followed by a distance to choose, such as "15 km".
  "ui.nearbyStations.within": "Within",
  "ui.nearbyStations.looking": "Looking…",
  "ui.nearbyStations.find": "Find stations",
  // {{radius}} is a distance with its unit, such as "15 km".
  "ui.nearbyStations.none": "No station is published within {{radius}} of that place.",

  // ── components/PanelPreview: the panel on a made-up farm ─────────────────
  "ui.panelPreview.illustrative": "Illustrative",
  "ui.panelPreview.heading": "Your panel, one day",
  "ui.panelPreview.intro": "These instruments read a made-up farm, and none of these figures come from a real station.",
  "ui.panelPreview.homeFarm": "Home Farm",
  // {{instrument}} is an instrument's name, such as "Barometer".
  "ui.panelPreview.lastDay": "{{instrument}}: the last day",
  "ui.panelPreview.log": "The log",
  "ui.panelPreview.date": "Date",
  "ui.panelPreview.signIn": "Sign in",

  // ── components/StationKeys ───────────────────────────────────────────────
  "ui.stationKeys.connected": "Connected",
  "ui.stationKeys.partial": "One key on file",
  "ui.stationKeys.none": "Not connected",
  "ui.stationKeys.heading": "Your station accounts",
  "ui.stationKeys.intro": "Your keys travel by Nostr message and are stored encrypted, and this page never sees them.",
  "ui.stationKeys.checking": "Checking…",
  // Follows "Connected ·": {{when}} is a date and time.
  "ui.stationKeys.delivered": "delivered {{when}}",
  "ui.stationKeys.makeKeys": "Make your keys",
  "ui.stationKeys.replace": "Replace keys",
  "ui.stationKeys.connect": "Connect",
  "ui.stationKeys.confirmRemove": "Yes, remove",
  "ui.stationKeys.keep": "Keep",
  "ui.stationKeys.remove": "Remove",
  // <phrase/> is a short code the message carries; {{vendor}} is "Ecowitt" or "Ambient Weather".
  "ui.stationKeys.checkMessages": "Check your Nostr messages for one marked <phrase/>, and reply with your {{vendor}} keys.",
  // <relay/> is a relay's address.
  "ui.stationKeys.replyOn": "Reply on <relay/>: replies elsewhere are missed.",
  "ui.stationKeys.replied": "I replied",
  "ui.stationKeys.cancel": "Cancel",
  "ui.stationKeys.inviteFailed": "The invitation could not be sent.",
  "ui.stationKeys.noReply": "No reply found yet: send it, then try again.",

  // ── components/StationMap ────────────────────────────────────────────────
  "ui.stationMap.yourPlace": "Your place",
  "ui.stationMap.remove": "Remove from my stations",
  "ui.stationMap.add": "Add to my stations",
  // "Find stations" is the button beside the map (ui.nearbyStations.find).
  "ui.stationMap.hint": "Tap the map to set your place, then choose Find stations.",

  // ── components/Trace ─────────────────────────────────────────────────────
  "ui.trace.empty": "This instrument has no trace for that period.",
  // The chart's spoken description: {{from}} and {{to}} are readings with their units.
  "ui.trace.aria": "{{label}}, from {{from}} to {{to}}",

  // ── views/Catalog ────────────────────────────────────────────────────────
  "views.catalog.visitCafe": "Visit the café",
  "views.catalog.shelfHeading": "From the Good Brew café",
  "views.catalog.shelfIntro": "The instruments for knowing your own terroir, with books and merchandise to go with them.",
  "views.catalog.wholeCatalog": "The whole catalog",
  "views.catalog.title": "Catalog",
  "views.catalog.intro": "The Good Brew café is FieldData's sibling storefront, and every order is placed at the café.",
  "views.catalog.shelvesFailed": "The café's shelves could not be read just now.",
  "views.catalog.readingShelves": "Reading the café's shelves…",
  "views.catalog.shop": "Shop this collection",
  "views.catalog.collectionFailed": "This collection could not be read just now.",
  "views.catalog.readingCollection": "Reading the collection…",

  // ── views/Home ───────────────────────────────────────────────────────────
  "views.home.title": "What your own ground actually measured.",
  "views.home.lead": "FieldData reads your weather station and soil probes as one panel of instruments, for you and for your AI agents.",
  "views.home.openPanel": "Open the panel",
  "views.home.signIn": "Sign in",
  "views.home.how": "How it works",
  "views.home.sources": "Sources",
  "views.home.illustrative": "Illustrative readings.",
  "views.home.why.station.title": "Your own station",
  "views.home.why.station.says": "Your station stays on your own vendor account, and FieldData reads it under your own keys.",
  "views.home.why.shape.title": "One shape of reading",
  "views.home.why.shape.says": "Every reading arrives in SI units and UTC, whichever station made it.",
  "views.home.why.kept.title": "Nothing kept",
  "views.home.why.kept.says": "Readings pass through to you: FieldData keeps a one-minute cache and no record of your ground.",
  "views.home.why.forecast.title": "Beside the forecast",
  "views.home.why.forecast.says": "Good Earth projects what a block of ground should do, and FieldData reports what it did.",
  "views.home.builtOn": "Built on Tollbooth DPYC™",
  // DPYC™ and Don't Pester Your Customer™ are marks: keep them in English with their ™.
  "views.home.dpyc": "DPYC™ stands for Don't Pester Your Customer™: you pre-fund a balance in Bitcoin Lightning and each reading draws on it, with no subscription or payment popup.",
  "views.home.identity": "Your identity is a Nostr key, so FieldData asks for no email address and no password.",
  "views.home.prices": "Prices",

  // ── views/How ────────────────────────────────────────────────────────────
  "views.how.title": "How it works",
  "views.how.signIn": "Sign in",
  "views.how.step.station.title": "Put up your station",
  "views.how.step.station.says": "Any Ecowitt gateway that reports to ecowitt.net will do, including the 4G WittField, and so will any station that reports to ambientweather.net.",
  "views.how.step.signIn.title": "Sign in with Nostr",
  "views.how.step.signIn.says": "Use an npub you already hold, or make a new key on the sign-in page.",
  "views.how.step.fund.title": "Fund your balance",
  "views.how.step.fund.says": "Pay a Lightning invoice from any Lightning wallet, or from the cash balance you hold in Strike or Cash App, and your tool fees draw on those sats.",
  "views.how.step.connect.title": "Connect your station",
  "views.how.step.connect.says": "Make an Application Key and an API Key at ecowitt.net or ambientweather.net/account, then send them by the Nostr message FieldData sends you.",
  "views.how.step.nearby.title": "Add stations nearby",
  "views.how.step.nearby.says": "Find stations near you on your Profile, on the list or the map, and tick them to join your own on the panel.",
  "views.how.step.read.title": "Read your instruments",
  "views.how.step.read.says": "Open the panel for the latest readings, and tap any instrument for its last day.",
  "views.how.step.log.title": "Keep the log",
  "views.how.step.log.says": "The log gives each day's temperature, frost hours, rain and degree-days.",
  "views.how.agentHeading": "For your AI agent",
  // <url/> is the service's address, shown in code type.
  "views.how.agent": "Add <url/> as a remote MCP server, and your agent reads the same stations under the same balance.",

  // ── views/Log ────────────────────────────────────────────────────────────
  "views.log.title": "Log",
  "views.log.from": "From",
  "views.log.to": "To",
  // The base temperature for degree-days; {{unit}} is "°C" or "°F".
  "views.log.base": "Base {{unit}}",
  "views.log.read": "Read the log",
  "views.log.reading": "Reading the log…",
  "views.log.date": "Date",
  // Column headings of the log, kept short: a unit follows some, as "Low (°C)".
  "views.log.col.low": "Low",
  "views.log.col.high": "High",
  // Hours of frost.
  "views.log.col.frost": "Frost h",
  "views.log.col.rain": "Rain",
  "views.log.col.degreeDays": "Degree-days",

  // ── views/Panel ──────────────────────────────────────────────────────────
  "views.panel.station": "Station",
  "views.panel.none": "No stations yet",
  "views.panel.addRemove": "Add or remove stations",
  // When the page asked the station.
  "views.panel.read": "Read",
  // When the station's sensors took the newest reading.
  "views.panel.observed": "Observed",
  "views.panel.readInstruments": "Read the instruments",
  "views.panel.wallet": "Wallet",
  "views.panel.lead": "Your station appears here once it reports to your account, or tick a nearby one on your Profile.",
  "views.panel.finding": "Finding your stations…",
  "views.panel.readingNewer": "Reading the station for newer values…",
  "views.panel.reading": "Reading the station…",
  // {{instrument}} is an instrument's name, such as "Barometer".
  "views.panel.lastDay": "{{instrument}}: the last day",
  "views.panel.readingTrace": "Reading the trace…",

  // ── views/Profile ────────────────────────────────────────────────────────
  "views.profile.units": "Units",
  "views.profile.unitsIntro": "The scales and figures on every instrument, on this device.",
  "views.profile.metric": "Metric",
  // US customary units: °F, inches, miles.
  "views.profile.us": "US",
  "views.profile.language": "Language",

  // ── views/Sources ────────────────────────────────────────────────────────
  "views.sources.title": "Sources",
  "views.sources.intro": "Every figure on this site comes from a place you can check, by arithmetic you can repeat.",
  "views.sources.ecowitt.title": "Your Ecowitt station",
  "views.sources.ecowitt.says1": "An Ecowitt station's readings come from your own account on Ecowitt.net, through its version 3 API.",
  "views.sources.ecowitt.says2": "All Ecowitt gateways upload there, the 4G WittField included.",
  "views.sources.ecowitt.link": "Ecowitt API reference",
  "views.sources.ambient.title": "Your Ambient Weather station",
  "views.sources.ambient.says1": "An Ambient Weather station's readings come from your own account on ambientweather.net, through its REST API.",
  "views.sources.ambient.says2": "Ambient allows one request a second, so a long first read of the log can take around half a minute.",
  "views.sources.ambient.says3": "The log counts a day's rain from the station's daily total, and its extra temperature sensors are not read.",
  "views.sources.ambient.link": "Ambient Weather API reference",
  "views.sources.units.title": "Units and clocks",
  "views.sources.units.says1": "FieldData asks the vendor for metric units and converts by the unit each value arrives with, and this site then shows the units you chose on your Profile.",
  "views.sources.units.says2": "Every reading is reported in UTC, and each day in the log is your station's own local day.",
  "views.sources.nearby.title": "Nearby stations",
  "views.sources.nearby.says1": "A station you tick on your Profile is read from what its owner publishes, through the service behind Ambient Weather's own map.",
  "views.sources.nearby.says2": "That service is undocumented and may change, and it gives the latest readings only, so a nearby station's history needs its owner's keys.",
  "views.sources.nearby.says3": "Its siting and calibration are its owner's.",
  "views.sources.frost.title": "Frost hours",
  // {{freezing}} is the freezing point with its unit: "32 °F" or "0 °C".
  "views.sources.frost.says1": "Each sample at or below {{freezing}} counts for the time that sample stands for.",
  "views.sources.frost.says2": "The log reads half-hour samples, so each cold one adds half an hour.",
  "views.sources.degreeDays.title": "Degree-days",
  "views.sources.degreeDays.says1": "The log uses the daily mean method: the larger of zero and (low + high) ÷ 2 − base.",
  "views.sources.degreeDays.says2": "You choose the base temperature when you read the log.",
  "views.sources.rain.title": "Rain",
  "views.sources.rain.says1": "A day's rain is the highest value of the station's running total that day.",
  "views.sources.rain.says2": "Ecowitt resets that total at local midnight, and FieldData takes Ambient Weather's daily total to do the same.",
  "views.sources.kept.title": "What is kept",
  "views.sources.kept.says1": "Answers stay in a one-minute cache and readings are not stored.",
  "views.sources.kept.says2": "Your vendor keys are stored encrypted under your npub, and you may delete them at any time.",
  "views.sources.goodEarth.says1": "Good Earth projects what a block of ground should do, and FieldData reports what it did.",
  "views.sources.wallets.title": "The wallet list",
  // "Need a wallet" names a button on the Wallet page.
  "views.sources.wallets.says1": "The wallets offered under Need a wallet come from the DPYC Oracle each time you open it.",
  "views.sources.wallets.link": "DPYC community",
  "views.sources.catalog.title": "The Catalog",
  "views.sources.catalog.says1": "The Catalog reads the Good Brew café's public feed, and the café takes every order.",
  "views.sources.icons.title": "Instrument faces",
  "views.sources.icons.says1": "The instrument icons are Weather Icons by Erik Flowers, under the SIL OFL 1.1.",
  "views.sources.code.title": "The code",
  "views.sources.code.says1": "FieldData and the Tollbooth DPYC™ runtime are open source under Apache-2.0.",
  "views.sources.code.link": "FieldData source",
  "views.sources.ecowittReach": "How far back Ecowitt reaches",
  "views.sources.ambientReach": "How far FieldData reads Ambient Weather",
  // Column headings: how often a sample is taken, how much one request returns, how far back the vendor keeps.
  "views.sources.sample": "Sample",
  "views.sources.eachRequest": "Each request",
  "views.sources.eachCall": "Each call",
  "views.sources.reach": "Reach",
  "views.sources.minute_one": "{{count}} minute",
  "views.sources.minute_other": "{{count}} minutes",
  "views.sources.hour_one": "{{count}} hour",
  "views.sources.hour_other": "{{count}} hours",
  "views.sources.day_one": "{{count}} day",
  "views.sources.day_other": "{{count}} days",
  "views.sources.year_one": "{{count}} year",
  "views.sources.year_other": "{{count}} years",

  // ── views/Terms: the glossary page ───────────────────────────────────────
  "views.terms.title": "Terms",
  "views.terms.intro": "What the words on this site mean.",
  "views.terms.searchPlaceholder": "Search the words",
  "views.terms.searchLabel": "Search the terms",
  "views.terms.none": "No term matches that.",
  "views.terms.termsOfUse": "Terms of use",

  // ── views/TermsOfUse: only the heading; the terms themselves stay in English ──
  "views.termsOfUse.title": "Terms of use",
};

/** A key as written in the catalog, plural suffix and all. */
export type EnglishKey = keyof typeof en;
type StripPlural<K> = K extends `${infer Base}_${"zero" | "one" | "two" | "few" | "many" | "other"}` ? Base : K;
/** A key as code asks for it: `x` stands for `x_one` / `x_other`, read with `{ count }`. */
export type MessageKey = StripPlural<EnglishKey>;
export type Messages = Record<EnglishKey, string>;
type PluralBase = EnglishKey extends infer K ? (K extends `${infer Base}_other` ? Base : never) : never;
/** One language's words: English's keys, plus the plural forms that language has beyond English's two. */
export type Translation = Partial<Messages> & Partial<Record<`${PluralBase}_${"zero" | "two" | "few" | "many"}`, string>>;

export default en as Messages;
