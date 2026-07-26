# Split Flap Display Card

A photorealistic airport-style split-flap instrument for Home Assistant. It combines a textured black aircraft-instrument housing, recessed bezel, optional cross-head screws and independently animated mechanical flap cells.

**Current release: v0.2.5**

> Every image below is an actual screenshot of the card rendered in Home Assistant. No mockups or synthetic visualisations are used.

## Real Home Assistant screenshots

### Live public-transport departure board

The structured departure-board mode supports transport icons, a built-in German-style S-Bahn badge, a live header clock and colour-coded delay information.

![Real Home Assistant split-flap departure board with delay](https://raw.githubusercontent.com/loungelizard2018/split-flap-display-card/main/docs/images/real-departure-board-delay.webp)

### Free segment composition

Independent segments can combine time values, fixed text, numeric entity states, coloured units and MDI icons in one physical row.

![Real Home Assistant split-flap segment display](https://raw.githubusercontent.com/loungelizard2018/split-flap-display-card/main/docs/images/real-home-systems-segment.webp)

### Compact value instrument with screws

The same component can be reduced to a compact value display while retaining the full aircraft-instrument housing.

![Real compact split-flap temperature display with screws](https://raw.githubusercontent.com/loungelizard2018/split-flap-display-card/main/docs/images/real-temperature-screws.webp)

### Compact value instrument without screws

Set `screws: false` for a cleaner recessed-panel variant.

![Real compact split-flap temperature display without screws](https://raw.githubusercontent.com/loungelizard2018/split-flap-display-card/main/docs/images/real-temperature-no-screws.webp)

## Features

- Real two-stage 3D flap animation with separate upper and lower halves
- Deterministic forward movement through a physical character wheel
- Sequential, short-wave or fully simultaneous cell starts
- Atomic refresh handling so changing source data cannot mix old and new rows
- Free segment composition from text, spacers, entities, attributes, dates and icons
- Direct structured public-transport departure-board mode
- Automatic recognition of bus, S-Bahn, regional train, train, subway, tram and ferry services
- Built-in green S-Bahn badge with a white `S`
- Separate colours for normal, delayed and cancelled departures
- Responsive proportional fitting for desktop, tablet and mobile dashboards
- Optional screws and transparent Home Assistant card surface
- No external JavaScript, image or font dependency at runtime

## Installation through HACS

1. Open **HACS → Dashboard**.
2. Open **Custom repositories**.
3. Add `https://github.com/loungelizard2018/split-flap-display-card` as category **Dashboard**.
4. Install or redownload **Split Flap Display Card**.
5. Select release **v0.2.5**.
6. Use **Update information** if HACS still displays an older README.
7. Reload the Home Assistant frontend without browser cache.

HACS registers:

```text
/hacsfiles/split-flap-display-card/split-flap-display-card.js
```

The browser console should report:

```text
SPLIT-FLAP-DISPLAY-CARD v0.2.5
```

## Complete departure-board example

```yaml
# Registers the custom Lovelace card.
type: custom:split-flap-display-card

# Selects the structured public-transport renderer.
display_mode: departure_board

# Entity containing station metadata and a structured departure array.
entity: sensor.central_station_departures

# Attribute containing the departure records.
departure_attribute: departures

# Attribute used as the automatic subtitle when subtitle is empty.
station_name_attribute: station_name

# Main heading above the board.
title: DEPARTURES

# Optional fixed subtitle; empty means use station_name_attribute.
subtitle: ""

# Number of physical departure rows rendered.
visible_rows: 5

# Shows TIME, LINE, DESTINATION, PLATFORM and DELAY headings.
show_column_headers: true

# Shows the current Home Assistant local time in the heading.
show_header_clock: true

# Starts all changed cells independently.
start_mode: simultaneous

# Delay in milliseconds between adjacent cell starts; 0 is fully simultaneous.
cell_stagger: 4

# Duration of one character-wheel step in milliseconds.
step_duration: 58

# Duration of a direct icon or special-token flap in milliseconds.
flip_duration: 118

# Shrinks the complete instrument proportionally to the Lovelace column.
fit_to_card: true

# Prevents enlargement above the natural physical size.
allow_upscale: false

# Maximum enlargement factor when allow_upscale is true.
max_fit_scale: 1

# Shows the four cross-head mounting screws.
screws: true

# Removes the normal Home Assistant card background.
transparent_card: true

# Natural width of one physical flap cell before responsive scaling.
cell_width: 34

# Natural height of one physical flap cell before responsive scaling.
cell_height: 50

# Horizontal gap between physical cells.
cell_gap: 3

# Vertical gap between departure rows.
row_gap: 8

# Font weight used for letters and numbers.
glyph_weight: 500

# Character size relative to the configured cell height.
glyph_scale: 0.61

# Vertical correction that keeps centre strokes in E, F and H readable.
glyph_offset_y: -1.5

# Physical field widths in flap cells.
board_columns:
  # Cells reserved for the transport symbol.
  mode: 2

  # Cells reserved for the departure time.
  time: 5

  # Cells reserved for the public line designation.
  line: 5

  # Cells reserved for the destination.
  destination: 20

  # Cells reserved for platform, track or bus bay.
  platform: 3

  # Cells reserved for delay or cancellation information.
  delay: 6

  # Empty cells inserted between adjacent fields.
  gap: 1

# Colours used by structured departure rows.
departure_colors:
  # On-time departure and route information.
  normal: "#f2c400"

  # Positive or negative delay values.
  delayed: "#ff5263"

  # Cancelled departures.
  cancelled: "#ff3347"

  # Column headings.
  header: "#aaa89e"

# Maps detected transport modes to built-in or MDI icons.
transport_icon_map:
  # Standard bus symbol.
  bus: mdi:bus

  # Built-in green S-Bahn badge with a white S.
  sbahn: splitflap:sbahn

  # Generic train or long-distance rail symbol.
  train: mdi:train

  # Regional rail symbol used for RE, RB, IRE and MEX lines.
  regional: mdi:train

  # Subway or underground symbol.
  subway: mdi:subway-variant

  # Tram or streetcar symbol.
  tram: mdi:tram

  # Ferry symbol.
  ferry: mdi:ferry

  # Fallback for an unknown transport type.
  unknown: mdi:transit-connection-variant
```

## Expected departure data

```yaml
# Human-readable station name used as the automatic subtitle.
station_name: Central Station

# Upcoming departures rendered from top to bottom.
departures:
  - # Public line designation.
    line: S8

    # Destination shown in the destination field.
    destination: Airport

    # Realtime departure time; preferred when present.
    departure_time: "18:45"

    # Scheduled time used as fallback.
    planned_time: "18:43"

    # Delay in minutes; positive values are late.
    delay: 2

    # Platform, track or bus bay.
    platform: "3"

    # Generic transport mode supplied by the integration.
    transportation_type: train

    # Indicates whether realtime data was available.
    is_realtime: true

    # Optional explicit cancellation flag.
    cancelled: false
```

Common line prefixes are classified automatically:

| Input | Mode |
|---|---|
| `S8`, `S23` | S-Bahn |
| `U2` | Subway |
| `RE1`, `RB48`, `IRE`, `MEX` | Regional train |
| `ICE`, `IC`, `EC` | Train |
| `transportation_type: bus` | Bus |
| `transportation_type: tram` | Tram |
| `transportation_type: ferry` | Ferry |

A positive delay appears as `(+4)`. A cancelled departure appears as `CANCEL`.

## Free segment example

```yaml
# Registers the custom Lovelace card.
type: custom:split-flap-display-card

# Selects free segment composition.
display_mode: segments

# Main instrument heading.
title: HOME SYSTEMS

# Secondary instrument heading.
subtitle: MECHANICAL STATUS DISPLAY

# Total physical cells in every row.
columns: 30

# Starts cells independently for a short mechanical wave.
start_mode: simultaneous

# Delay in milliseconds between adjacent changed cells.
cell_stagger: 6

# Shows the mounting screws; set false for the clean panel variant.
screws: true

# Defines the physical display rows.
rows:
  - # Aligns combined row content from the left edge.
    align: left

    # Ordered independent segments in this row.
    segments:
      - # Formats an ISO date/time entity.
        type: datetime

        # Entity providing the date/time state.
        entity: sensor.example_date_time

        # 24-hour hours and minutes.
        format: "HH:mm"

        # Number of reserved physical cells.
        width: 5

      - # Inserts an empty physical cell.
        type: spacer

        # Number of empty cells.
        width: 1

      - # Displays fixed literal text.
        type: text

        # Text shown by the flap cells.
        value: HOME READY

        # Number of reserved physical cells.
        width: 12

      - # Inserts another empty cell.
        type: spacer

        # Number of empty cells.
        width: 1

      - # Displays an entity state.
        type: entity

        # Numeric entity to display.
        entity: sensor.example_temperature

        # Number of decimal places.
        decimals: 1

        # Text appended after the value.
        suffix: "°C"

        # Number of reserved physical cells.
        width: 6

        # Alignment inside the reserved cells.
        align: right

        # CSS colour for this segment.
        color: "#79d7ff"

      - # Displays a fixed Material Design icon.
        type: icon

        # MDI icon rendered by Home Assistant.
        icon: mdi:home-outline

        # One physical icon cell.
        width: 1

        # CSS colour for the icon.
        color: "#79d7ff"
```

## Compact value example

```yaml
# Registers the custom Lovelace card.
type: custom:split-flap-display-card

# Uses free segment composition.
display_mode: segments

# Main heading.
title: TEMPERATURE

# Secondary heading.
subtitle: CPU SERVER

# Six physical cells: four value characters, one spacer and one unit cell.
columns: 6

# Set true for the screwed instrument variant, false for the clean panel.
screws: true

# Prevents the compact display from exceeding its dashboard column.
fit_to_card: true

# Defines the compact value row.
rows:
  - segments:
      - # Displays the numeric sensor state.
        type: entity

        # Numeric temperature entity.
        entity: sensor.example_cpu_temperature

        # One decimal place.
        decimals: 1

        # Four cells reserved for the value.
        width: 4

        # Right-aligns the value.
        align: right

      - # Inserts one blank flap between value and unit.
        type: spacer

        # Number of blank cells.
        width: 1

      - # Displays the temperature unit as fixed text.
        type: text

        # Unit text.
        value: "°C"

        # One unit cell.
        width: 1
```

## Animation modes

### Strictly sequential

```yaml
# Runs changed cells through a bounded worker queue.
start_mode: sequential

# Allows only one physical cell to animate at a time.
max_parallel_cells: 1

# Wait before starting the next changed cell.
cell_stagger: 60
```

### Mechanical wave

```yaml
# Starts all changed cells independently.
start_mode: simultaneous

# Creates a short visible wave.
cell_stagger: 4
```

### Fully simultaneous

```yaml
# Starts all changed cells independently.
start_mode: simultaneous

# Removes the start delay completely.
cell_stagger: 0
```

Text cells always advance through the ordered character wheel. A change from `A` to `D` therefore shows `A → B → C → D`.

## Supported segment types

| Type | Purpose |
|---|---|
| `text` | Fixed literal text |
| `spacer` | Fixed number of empty cells |
| `entity` | Home Assistant entity state |
| `attribute` | One entity attribute |
| `friendly_name` | Entity friendly name |
| `datetime` | Formatted date/time state |
| `icon` | Fixed MDI icon |
| `entity_icon` | Icon read from an entity |

## Common segment fields

| Field | Effect |
|---|---|
| `width` | Number of reserved physical cells |
| `align` | `left`, `center` or `right` |
| `pad` | Character used to fill unused cells |
| `prefix`, `suffix` | Text added around the source value |
| `uppercase` | Overrides card-wide uppercase conversion |
| `overflow` | Clips content exceeding `width` |
| `decimals` | Numeric decimal places |
| `decimal_separator` | Set to `,` for comma decimals |
| `use_entity_unit` | Appends the entity unit |
| `unit_separator` | Text inserted before the unit |
| `color` | CSS glyph colour |

## Update consistency

When source data changes during an animation, the card:

1. invalidates the old animation generation;
2. cancels pending timers;
3. returns half-flipped cells to a stable state;
4. assigns the complete new target board;
5. starts a fresh animation from the stable state.

This prevents rows from different departure snapshots being mixed.

## Troubleshooting

### HACS displays an older README

Use **Update information** in the repository menu and reload the HACS page. HACS caches metadata separately from downloaded JavaScript.

### The browser still runs an older card

Perform a cache-free reload and verify:

```text
SPLIT-FLAP-DISPLAY-CARD v0.2.5
```

### Departure board is blank

Verify that `entity` exists, `departure_attribute` contains an array, and every record includes `line`, `destination` and either `departure_time` or `planned_time`.

### Destination is truncated

Increase `board_columns.destination`.

## Repository structure

```text
split-flap-display-card.js   Main custom element and module loader
split-flap-config.js         Configuration validation and normalisation
split-flap-render.js         DOM and physical-cell construction
split-flap-update.js         Data adapters and atomic animation logic
split-flap-styles.js         Instrument and flap styling
split-flap-utils.js          Tokens, colours and character sets
examples/                    Fully commented Lovelace examples
docs/images/                 Real Home Assistant screenshots
```

## Credits

The behaviour of existing split-flap projects, including `RazManSource/splitflap-card`, was reviewed as reference. This card uses an independent deterministic animation engine rather than random character scrambling.

The built-in S-Bahn badge is an original local rendering inspired by the familiar German green-circle-and-white-S convention; no third-party logo image is downloaded or bundled.

## Licence

MIT
