# Split Flap Display Card

A photorealistic airport-style split-flap instrument for Home Assistant. The black textured housing, recessed bezel and cross-head screws visually match the companion Analog Gauge Card and Mechanical Counter Card.

## Version 0.2.2

### Highlights

- Free segment composition for text, entity states, attributes, friendly names, date/time values and MDI icons
- Direct OpenPublicTransport departure-board mode without a template sensor
- Automatic recognition of bus, S-Bahn, train, regional train, subway, tram and ferry services
- German-style green S-Bahn badge rendered locally without an external image dependency
- Separate colours for normal, delayed and cancelled departures
- Sequential, parallel or near-simultaneous mechanical switching
- Deterministic forward movement through a physical character wheel
- Atomic refresh logic: interrupted animations are cancelled cleanly before a new timetable is rendered
- Improved glyph placement so centre strokes in `E`, `F` and `H` remain visible
- Responsive proportional fitting for desktop, tablet and mobile dashboards
- No external JavaScript or font dependencies

## Installation through HACS

1. Open **HACS → Dashboard**.
2. Open **Custom repositories**.
3. Add `https://github.com/loungelizard2018/split-flap-display-card` as category **Dashboard**.
4. Install or redownload **Split Flap Display Card**.
5. Select release **v0.2.2**.
6. Reload the Home Assistant frontend without browser cache.

HACS registers the main module at:

```text
/hacsfiles/split-flap-display-card/split-flap-display-card.js
```

The JavaScript console should report:

```text
SPLIT-FLAP-DISPLAY-CARD v0.2.2
```

## Display modes

The card supports two modes:

- `departure_board`: reads structured public-transport departures from one entity attribute.
- `segments`: combines arbitrary Home Assistant values into one or more physical flap rows.

---

# OpenPublicTransport departure board

The card reads the `departures` attribute directly. No additional template sensor is required.

## Complete Odendorf example

Every configurable YAML field is documented inline.

```yaml
# Home Assistant custom-card type.
type: custom:split-flap-display-card

# Selects the structured public-transport renderer.
display_mode: departure_board

# Entity supplied by the OpenPublicTransport integration.
entity: sensor.swisttal_odendorf_bf_nahreisezug_swisttal_odendorf_bf

# Entity attribute containing the list of departure records.
departure_attribute: departures

# Entity attribute used as the station subtitle.
station_name_attribute: station_name

# Main heading engraved above the flap board.
title: ABFAHRTSTAFEL

# Optional fixed subtitle. When omitted, station_name_attribute is used.
# subtitle: SWISTTAL ODENDORF BF

# Maximum number of departure records rendered as physical rows.
visible_rows: 8

# Shows TIME, LINE, DESTINATION, PLATFORM and DELAY labels.
show_column_headers: true

# Shows the current Home Assistant local time in the upper-right corner.
show_header_clock: true

# simultaneous starts all changed cells in the same update cycle.
# sequential processes changed cells in order.
start_mode: simultaneous

# Delay in milliseconds between the start of adjacent changed cells.
# 0 means exactly simultaneous; 4 creates a very short mechanical wave.
cell_stagger: 4

# Duration in milliseconds of one character-wheel step.
# A to D still performs A → B → C → D.
step_duration: 58

# Duration in milliseconds of a direct icon or colour-only flap.
flip_duration: 118

# Proportionally shrinks the complete instrument to the Lovelace column.
fit_to_card: true

# Prevents the natural instrument size from being enlarged on wide screens.
allow_upscale: false

# Maximum enlargement factor when allow_upscale is true.
max_fit_scale: 1

# Shows the four black cross-head instrument screws.
screws: true

# Removes the normal Home Assistant card background around the instrument.
transparent_card: true

# Natural width of one physical flap cell before responsive scaling.
cell_width: 34

# Natural height of one physical flap cell before responsive scaling.
cell_height: 50

# Horizontal space between adjacent physical flap cells.
cell_gap: 3

# Vertical space between departure rows.
row_gap: 8

# Font weight used for letters and digits on each flap.
glyph_weight: 500

# Character height as a fraction of cell_height.
glyph_scale: 0.61

# Vertical glyph correction in pixels.
# A small negative value moves E/F/H centre strokes away from the flap seam.
glyph_offset_y: -1.5

# Number of physical cells reserved for each departure field.
board_columns:
  # Transport symbol: bus, S-Bahn, train, tram and so on.
  mode: 2

  # Departure time, normally HH:mm.
  time: 5

  # Service or route identifier, for example S23 or 747.
  line: 5

  # Destination text. Longer values are clipped to this width.
  destination: 20

  # Platform or track information.
  platform: 3

  # Delay text such as (+5), or CANCEL for cancellation.
  delay: 6

  # Empty physical cells inserted between every field.
  gap: 1

# Text colours used for departure data.
departure_colors:
  # Normal and on-time departure colour.
  normal: "#f2c400"

  # Delay indicator colour when delay is non-zero.
  delayed: "#ff5263"

  # Complete-row colour for cancelled services.
  cancelled: "#ff3347"

  # Non-flap column-header colour.
  header: "#aaa89e"

# Mapping between detected transport modes and displayed symbols.
transport_icon_map:
  # Standard MDI bus symbol.
  bus: mdi:bus

  # Built-in green German-style S-Bahn badge.
  # Use mdi:alpha-s-circle to restore the generic MDI symbol.
  sbahn: splitflap:sbahn

  # Long-distance or otherwise generic train.
  train: mdi:train

  # Regional trains such as RE, RB, R, IRE and MEX.
  regional: mdi:train

  # Underground or metro services, including line names beginning with U.
  subway: mdi:subway-variant

  # Tram or streetcar services.
  tram: mdi:tram

  # Ferry services.
  ferry: mdi:ferry

  # Fallback when no transport mode can be identified.
  unknown: mdi:transit-connection-variant
```

## OpenPublicTransport fields used

Each entry in the configured departure attribute may contain:

| Field | Purpose |
|---|---|
| `departure_time` | Real-time departure time displayed in the TIME column |
| `planned_time` | Scheduled fallback when departure_time is unavailable |
| `line` | Route or service identifier |
| `destination` | Destination shown in the main text field |
| `platform` | Platform or track |
| `delay` | Signed delay in minutes |
| `transportation_type` | Generic type such as `bus` or `train` |
| `cancelled` / `is_cancelled` | Optional cancellation flag |

Additional fields such as `agency`, `notices`, `is_realtime` and `minutes_until_departure` may remain present; version 0.2.2 does not display them directly.

## Automatic transport classification

The line name is evaluated before the generic transportation type:

- `S23` → S-Bahn
- `U3` → subway
- `RE5`, `RB48`, `R`, `IRE`, `MEX` → regional train
- `ICE`, `IC`, `EC` → train
- transportation type containing `bus` → bus
- transportation type containing `tram` or `streetcar` → tram
- transportation type containing `subway` or `metro` → subway
- transportation type containing `ferry` → ferry
- transportation type containing `train` or `rail` → train

---

# Animation modes

## Strictly sequential

```yaml
# Starts one changed cell only after the previous cell is complete.
start_mode: sequential

# Number of cells allowed to animate in parallel in sequential mode.
max_parallel_cells: 1

# Pause in milliseconds between completed cells.
cell_stagger: 40
```

## Fast mechanical wave

```yaml
# Starts changed cells independently rather than waiting for completion.
start_mode: simultaneous

# Small index-based delay creates a visible wave across the board.
cell_stagger: 4

# Speed of every intermediate character step.
step_duration: 58

# Speed for icons and colour-only changes.
flip_duration: 118
```

## Exactly simultaneous

```yaml
# Starts every changed cell in the same update cycle.
start_mode: simultaneous

# Removes the left-to-right start delay entirely.
cell_stagger: 0
```

Text cells always advance through the ordered character wheel. A change from `A` to `D` therefore shows `A → B → C → D`. MDI icons and the built-in S-Bahn badge use one complete direct flap because a physical mechanism cannot plausibly hold the complete MDI catalogue on one wheel.

---

# Free segment mode

Segment mode builds each physical row from independent blocks. A single row can combine a time sensor, spaces, a friendly name, an entity state and an MDI icon.

```yaml
# Home Assistant custom-card type.
type: custom:split-flap-display-card

# Selects free row and segment composition.
display_mode: segments

# Main title above the physical board.
title: HOME STATUS

# Optional subtitle below the title.
subtitle: ODENDORF

# Number of physical flap cells in every row.
columns: 30

# Starts all changed cells with a small wave.
start_mode: simultaneous

# Milliseconds between adjacent cell starts.
cell_stagger: 6

# Complete physical rows.
rows:
  - # Alignment used when all segments consume fewer than columns cells.
    align: left

    # Ordered segments placed from left to right.
    segments:
      - # Formats a timestamp entity as time text.
        type: datetime

        # Entity containing an ISO timestamp or compatible date/time value.
        entity: sensor.date_time_iso

        # Supported placeholders: yyyy, MM, dd, HH, mm and ss.
        format: "HH:mm"

        # Reserves exactly five physical cells.
        width: 5

      - # Adds an empty physical gap.
        type: spacer

        # Number of empty cells.
        width: 1

      - # Displays the friendly_name attribute of an entity.
        type: friendly_name

        # Source entity whose friendly name is shown.
        entity: sensor.bigpool_cpu_temperature

        # Reserves and clips to fourteen physical cells.
        width: 14

      - # Adds another empty physical gap.
        type: spacer

        # Number of empty cells.
        width: 1

      - # Displays an entity state.
        type: entity

        # Source entity.
        entity: sensor.bigpool_cpu_temperature

        # Number of decimal places for numeric states.
        decimals: 0

        # Text appended directly after the formatted state.
        suffix: "°"

        # Reserves five physical cells.
        width: 5

        # Right-aligns the state inside its reserved width.
        align: right

      - # Displays one static MDI icon as one mechanical cell.
        type: icon

        # MDI icon name.
        icon: mdi:cpu-64-bit

        # Number of reserved cells. One is normally sufficient for an icon.
        width: 1
```

## Supported segment types

### `text`

```yaml
# Displays constant text.
type: text

# Literal content rendered by the flap cells.
value: "SYSTEM READY"

# Number of physical cells reserved for the text.
width: 16

# Converts text to uppercase when true.
uppercase: true

# Optional text colour for this segment.
color: "#f2c400"
```

### `entity`

```yaml
# Displays the state of a Home Assistant entity.
type: entity

# Source entity ID.
entity: sensor.outdoor_temperature

# Number of decimal places when the state is numeric.
decimals: 1

# Replaces the decimal dot with a comma.
decimal_separator: ","

# Appends the entity unit_of_measurement attribute automatically.
use_entity_unit: true

# Text inserted between value and automatic unit.
unit_separator: " "

# Number of physical cells reserved for the complete result.
width: 8

# Right-aligns shorter results within the reserved cells.
align: right
```

### `attribute`

```yaml
# Displays one attribute of an entity.
type: attribute

# Source entity ID.
entity: weather.home

# Attribute name read from the entity.
attribute: temperature

# Number of physical cells reserved for the attribute value.
width: 6
```

### `friendly_name`

```yaml
# Displays the friendly_name attribute.
type: friendly_name

# Source entity ID.
entity: sensor.bigpool_cpu_temperature

# Number of physical cells reserved for the friendly name.
width: 18
```

### `datetime`

```yaml
# Formats an entity value as a date or time.
type: datetime

# Entity containing an ISO-compatible date/time value.
entity: sensor.next_event

# Optional source attribute instead of the state.
attribute: start_time

# Output placeholders: yyyy, MM, dd, HH, mm and ss.
format: "dd.MM. HH:mm"

# Optional IANA timezone override.
time_zone: Europe/Berlin

# Number of physical cells reserved for the formatted value.
width: 12
```

### `icon`

```yaml
# Displays a fixed MDI icon.
type: icon

# Icon identifier supplied by Home Assistant.
icon: mdi:home-assistant

# Number of physical cells reserved for the icon.
width: 1

# Optional icon colour.
color: "#f2c400"
```

### `entity_icon`

```yaml
# Reads the icon attribute from an entity.
type: entity_icon

# Source entity ID.
entity: climate.living_room

# Fallback used when the entity does not provide an icon attribute.
fallback_icon: mdi:thermostat

# Number of physical cells reserved for the icon.
width: 1
```

### `spacer`

```yaml
# Reserves blank physical cells.
type: spacer

# Number of blank cells.
width: 2
```

## Shared segment options

| Option | Meaning |
|---|---|
| `width` | Number of physical cells reserved for the segment |
| `align` | `left`, `center` or `right` alignment inside width |
| `pad` | Single character used for empty reserved cells |
| `prefix` | Text placed before the segment value |
| `suffix` | Text placed after the segment value |
| `uppercase` | Overrides card-level uppercase conversion |
| `color` | CSS colour applied to this segment |
| `decimals` | Numeric decimal places for entity values |
| `decimal_separator` | `.` or `,` for numeric output |
| `use_entity_unit` | Appends unit_of_measurement automatically |
| `unit_separator` | Separator inserted before the automatic unit |

---

# Global configuration reference

| Field | Default | Meaning |
|---|---:|---|
| `display_mode` | `segments` | `segments` or `departure_board` |
| `title` | mode dependent | Main instrument heading |
| `subtitle` | empty | Fixed subtitle; overrides station attribute |
| `columns` | calculated / `28` | Physical cells in every row |
| `character_set` | `airport_de` | Ordered character wheel |
| `uppercase` | `true` | Converts normal text to uppercase |
| `screws` | `true` | Shows instrument screws |
| `transparent_card` | `true` | Removes standard HA card background |
| `fit_to_card` | `true` | Shrinks instrument to available width |
| `allow_upscale` | `false` | Permits enlargement above natural size |
| `max_fit_scale` | `1` | Maximum enlargement factor |
| `cell_width` | `34` | Natural cell width in pixels |
| `cell_height` | `50` | Natural cell height in pixels |
| `cell_gap` | `3` | Horizontal cell gap in pixels |
| `row_gap` | `8` | Vertical row gap in pixels |
| `start_mode` | `sequential` | `sequential` or `simultaneous` |
| `max_parallel_cells` | `1` | Parallel workers in sequential mode |
| `cell_stagger` | `18` | Delay between cell starts |
| `step_duration` | `72` | Duration of one wheel character step |
| `flip_duration` | `136` | Direct icon or colour flap duration |
| `text_color` | `#f2f1e9` | Default segment-mode glyph colour |
| `glyph_weight` | `500` | Glyph font weight |
| `glyph_scale` | `0.61` | Glyph height relative to cell height |
| `glyph_offset_y` | `-1.5` | Vertical glyph correction |
| `unavailable_text` | `UNAVAILABLE` | Replacement for unavailable states |
| `unknown_text` | `UNKNOWN` | Replacement for unknown states |

---

# Troubleshooting

## HACS shows an old README

HACS may cache repository metadata independently from the downloaded JavaScript files. Confirm the actual runtime version in the browser console:

```text
SPLIT-FLAP-DISPLAY-CARD v0.2.2
```

Then use **HACS → Split Flap Display Card → Redownload → v0.2.2** and reload the frontend without browser cache.

## A timetable update mixes two destinations in one row

This was fixed in version 0.2.2. Earlier releases could leave the upper and lower halves of an interrupted cell on different generations when the departure list shifted during an animation.

## Module not found after updating

Confirm that the HACS installation directory contains:

```text
split-flap-display-card.js
split-flap-config.js
split-flap-render.js
split-flap-update.js
split-flap-styles.js
split-flap-utils.js
```

## Development check

```bash
# Checks JavaScript syntax for every shipped module.
npm run check
```

## Credits

The behaviour of existing Home Assistant split-flap projects, including `RazManSource/splitflap-card`, was reviewed as reference. This card uses an independent deterministic character-wheel and animation engine rather than random character scrambling.

The built-in S-Bahn badge is an original CSS-rendered symbol inspired by the familiar German green circular S-Bahn sign. It does not download or redistribute an external logo asset.

## Licence

MIT
