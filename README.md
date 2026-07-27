<p align="center">
  <img src="https://raw.githubusercontent.com/loungelizard2018/split-flap-display-card/main/docs/images/brand-icon.svg" alt="Split Flap Display Card logo" width="128">
</p>

# Split Flap Display Card

A photorealistic airport-style split-flap instrument for Home Assistant. It combines a textured black aircraft-instrument housing, recessed bezel, optional cross-head screws and independently animated mechanical flap cells.

**Current release: v0.2.14**

> Every product image below is an actual screenshot of the card rendered in Home Assistant. No mockups or synthetic product visualisations are used.

## Real Home Assistant screenshots

### Public-transport departure board

![Real Home Assistant split-flap departure board with delay](https://raw.githubusercontent.com/loungelizard2018/split-flap-display-card/main/docs/images/real-departure-board-delay.webp)

### Free segment composition

![Real Home Assistant split-flap segment display](https://raw.githubusercontent.com/loungelizard2018/split-flap-display-card/main/docs/images/real-home-systems-segment.webp)

### Compact value instrument with screws

![Real compact split-flap temperature display with screws](https://raw.githubusercontent.com/loungelizard2018/split-flap-display-card/main/docs/images/real-temperature-screws.webp)

### Compact value instrument without screws

![Real compact split-flap temperature display without screws](https://raw.githubusercontent.com/loungelizard2018/split-flap-display-card/main/docs/images/real-temperature-no-screws.webp)

## Features

- Photorealistic black aircraft-instrument housing
- Independent upper and lower flap halves with a two-stage `rotateX` animation
- Direct structured public-transport board without a template sensor
- Built-in bus, S-Bahn, regional rail, train, subway, tram and ferry classification
- Built-in green S-Bahn badge
- Separate colours for normal, delayed and cancelled departures
- Flexible text, spacer, entity, attribute, date/time and MDI-icon segments
- Responsive proportional scaling for desktop, tablet and mobile dashboards
- First-load animation from a completely empty board
- Visible blank-to-character flap movement during startup
- Separate timing controls for startup rows and later live updates
- Snapshot queue for Home Assistant state changes received during an active animation
- Row-atomic live updates that cannot mix two departure snapshots
- Optional full character-wheel animation
- Optional click or keyboard replay for demonstrations and recordings
- No external JavaScript or font dependencies at runtime

## Installation through HACS

1. Open **HACS → Dashboard**.
2. Open **Custom repositories**.
3. Add `https://github.com/loungelizard2018/split-flap-display-card` as category **Dashboard**.
4. Install or redownload **Split Flap Display Card**.
5. Select release **v0.2.14**.
6. Choose **Update information** if HACS still displays an older README.
7. Reload the Home Assistant frontend without browser cache.

HACS registers:

```text
/hacsfiles/split-flap-display-card/split-flap-display-card.js
```

The browser console should report:

```text
SPLIT-FLAP-DISPLAY-CARD v0.2.14
```

## Animation model

The card treats startup and live updates as separate operations.

### First-load startup

`initial_animation_style: direct` starts from empty cells and performs one real mechanical flap from blank to the final character. Every populated cell in one row starts together. Complete rows follow one another using `initial_row_stagger`.

```yaml
# Plays a mechanical build when the card is first rendered.
animate_on_first_load: true

# direct: one real blank-to-final flap per populated cell.
# wheel: moves through the complete ordered character wheel.
initial_animation_style: direct

# Waits before the first row starts.
initial_animation_delay: 450

# Duration of one startup flap.
initial_flip_duration: 220

# Delay between complete startup rows.
# This no longer affects later sensor updates.
initial_row_stagger: 120

# Empty starting character.
initial_fill_char: " "

# Allows replay by clicking the instrument or pressing Enter/Space.
replay_on_tap: false
```

### Live sensor updates

Public-transport boards default to `live_update_style: direct`. Every changed cell in a row performs one flap to its new value. A complete sensor snapshot finishes before the next queued snapshot starts.

```yaml
# direct: one flap from the current value to the new value.
# wheel: advances through the ordered character wheel.
live_update_style: direct

# Starts changed rows together.
start_mode: simultaneous

# Optional delay between changed rows in direct live-update mode.
live_row_stagger: 0

# Used only for individual cells in wheel mode.
cell_stagger: 4

# Duration of a direct live-update flap.
flip_duration: 118

# Duration of one character-wheel step.
step_duration: 58
```

`initial_row_stagger` and `cell_stagger` are deliberately separate. A large startup row delay therefore cannot make later destination text appear shifted.

## Complete departure-board example

This generic example assumes an entity called `sensor.central_station_departures` with a structured `departures` attribute.

```yaml
# Registers the custom Lovelace card.
type: custom:split-flap-display-card

# Selects the structured public-transport renderer.
display_mode: departure_board

# Entity containing departures and station metadata.
entity: sensor.central_station_departures

# Attribute containing the list of departure records.
departure_attribute: departures

# Attribute used as the automatic subtitle.
station_name_attribute: station_name

# Main heading printed above the board.
title: DEPARTURES

# Optional fixed subtitle.
# Leave empty to use station_name_attribute automatically.
subtitle: ""

# Number of departure rows physically rendered.
visible_rows: 5

# Shows TIME, LINE, DESTINATION, PLATFORM and DELAY headings.
show_column_headers: true

# Shows the current Home Assistant local time.
show_header_clock: true

# Builds the board from empty cells when the page opens.
animate_on_first_load: true

# Uses one real blank-to-final flap per populated cell.
initial_animation_style: direct

# Waits before the first row starts.
initial_animation_delay: 450

# Duration of one startup flap.
initial_flip_duration: 220

# Delay between complete startup rows.
initial_row_stagger: 120

# Empty startup character.
initial_fill_char: " "

# Disable click replay for normal dashboards.
replay_on_tap: false

# Uses stable row-atomic live updates.
live_update_style: direct

# Starts all changed rows together.
start_mode: simultaneous

# No additional delay between changed live rows.
live_row_stagger: 0

# Used only when live_update_style is wheel.
cell_stagger: 4

# Duration of direct live-update flaps.
flip_duration: 118

# Duration of one wheel step when wheel mode is selected.
step_duration: 58

# Shrinks the complete instrument to the available Lovelace width.
fit_to_card: true

# Prevents enlargement above the natural physical size.
allow_upscale: false

# Maximum enlargement factor if allow_upscale is enabled.
max_fit_scale: 1

# Shows four cross-head mounting screws.
screws: true

# Removes the normal Home Assistant card surface.
transparent_card: true

# Natural width of one physical flap cell.
cell_width: 34

# Natural height of one physical flap cell.
cell_height: 50

# Horizontal gap between adjacent flap cells.
cell_gap: 3

# Vertical gap between departure rows.
row_gap: 8

# Glyph font weight.
glyph_weight: 500

# Glyph size relative to cell height.
glyph_scale: 0.61

# Vertical glyph correction.
glyph_offset_y: -1.5

# Physical field widths.
board_columns:
  # Cells reserved for the transport icon.
  mode: 2

  # Cells reserved for departure time.
  time: 5

  # Cells reserved for line number or name.
  line: 5

  # Cells reserved for destination text.
  destination: 20

  # Cells reserved for platform, track or bus bay.
  platform: 3

  # Cells reserved for delay or cancellation.
  delay: 6

  # Empty cells between adjacent fields.
  gap: 1

# Colours for structured departure data.
departure_colors:
  # Normal route information.
  normal: "#f2c400"

  # Positive or negative delay information.
  delayed: "#ff5263"

  # Cancelled departures.
  cancelled: "#ff3347"

  # Column headings.
  header: "#aaa89e"

# Transport-mode icon mapping.
transport_icon_map:
  # Standard bus symbol.
  bus: mdi:bus

  # Built-in green S-Bahn badge.
  sbahn: splitflap:sbahn

  # Generic or long-distance train.
  train: mdi:train

  # Regional rail.
  regional: mdi:train

  # Subway or underground.
  subway: mdi:subway-variant

  # Tram or streetcar.
  tram: mdi:tram

  # Ferry.
  ferry: mdi:ferry

  # Fallback for unknown modes.
  unknown: mdi:transit-connection-variant
```

The fully commented file is stored at:

```text
examples/openpublictransport-departure-board.yaml
```

## Expected departure data

```yaml
# Human-readable station name.
station_name: Central Station

# Upcoming departures.
departures:
  - # Public line designation.
    line: S8

    # Destination text.
    destination: Airport

    # Realtime time displayed first.
    departure_time: "18:45"

    # Scheduled fallback time.
    planned_time: "18:43"

    # Delay in minutes.
    delay: 2

    # Platform, track or bus bay.
    platform: "3"

    # Generic integration mode.
    transportation_type: train

    # Realtime-data flag.
    is_realtime: true

    # Optional cancellation flag.
    cancelled: false
```

Common detection:

| Line or type | Detected mode |
|---|---|
| `S8`, `S23` | S-Bahn |
| `U2` | Subway |
| `RE1`, `RB48`, `IRE`, `MEX` | Regional rail |
| `ICE`, `IC`, `EC` | Train |
| `transportation_type: bus` | Bus |
| `transportation_type: tram` | Tram |
| `transportation_type: ferry` | Ferry |

A positive delay appears as `(+4)`. A cancelled departure appears as `CANCEL`.

## Free segment mode

```yaml
# Registers the custom Lovelace card.
type: custom:split-flap-display-card

# Selects free segment composition.
display_mode: segments

# Main heading.
title: HOME SYSTEMS

# Optional subtitle.
subtitle: MECHANICAL STATUS DISPLAY

# Total number of cells per row.
columns: 30

# Builds the row from empty cells.
animate_on_first_load: true

# Uses real blank-to-final flaps.
initial_animation_style: direct

# Delay before startup.
initial_animation_delay: 450

# Startup flap duration.
initial_flip_duration: 220

# Delay between startup rows.
initial_row_stagger: 120

# Uses full wheel movement for later segment changes.
live_update_style: wheel

# Starts changed cells independently.
start_mode: simultaneous

# Short wave between changed wheel cells.
cell_stagger: 6

# Defines display rows.
rows:
  - # Aligns combined content from the left.
    align: left

    # Ordered segments.
    segments:
      - # Formatted date/time entity.
        type: datetime

        # Entity containing an ISO date/time state.
        entity: sensor.example_date_time

        # 24-hour time format.
        format: "HH:mm"

        # Reserved physical cells.
        width: 5

      - # One empty cell.
        type: spacer
        width: 1

      - # Fixed text.
        type: text
        value: HOME READY
        width: 12

      - # Another empty cell.
        type: spacer
        width: 1

      - # Numeric entity state.
        type: entity
        entity: sensor.example_temperature
        decimals: 1
        suffix: "°C"
        width: 6
        align: right
        color: "#79d7ff"

      - # Material Design icon.
        type: icon
        icon: mdi:home-outline
        width: 1
        color: "#79d7ff"
```

Supported segment types:

| Type | Purpose |
|---|---|
| `text` | Fixed literal text |
| `spacer` | Fixed number of empty cells |
| `entity` | Entity state |
| `attribute` | Entity attribute |
| `friendly_name` | Entity friendly name |
| `datetime` | Formatted date/time |
| `icon` | Fixed MDI icon |
| `entity_icon` | Icon read from an entity |

## Video-recording configuration

Use these temporary options:

```yaml
# Starts from an empty board.
animate_on_first_load: true

# Shows real blank-to-final flap movement.
initial_animation_style: direct

# Keeps the empty board visible for one second.
initial_animation_delay: 1000

# Makes the flap movement clearly visible.
initial_flip_duration: 260

# Starts complete rows 150 ms apart.
initial_row_stagger: 150

# Allows replay by clicking the instrument.
replay_on_tap: true

# Keeps later state updates compact and stable.
live_update_style: direct
live_row_stagger: 0
```

The complete recording example is stored at:

```text
examples/video-recording-demo.yaml
```

### Record on macOS

1. Open the dashboard and wait until the first build is complete.
2. Press `Cmd + Shift + 5`.
3. Select **Record Selected Portion**.
4. Draw the capture area around the instrument.
5. Start recording.
6. Click the instrument once.
7. Wait two seconds after the last row settles.
8. Stop from the macOS menu bar.
9. Trim the start and end in QuickTime Player.

### Convert MOV to MP4

```bash
ffmpeg \
  -i input.mov \
  -vf "scale=1200:-2:flags=lanczos,fps=30" \
  -c:v libx264 \
  -crf 20 \
  -preset slow \
  -pix_fmt yuv420p \
  -movflags +faststart \
  split-flap-demo.mp4
```

### Convert MOV to animated WebP

```bash
ffmpeg \
  -i input.mov \
  -vf "fps=20,scale=1200:-2:flags=lanczos" \
  -loop 0 \
  -c:v libwebp_anim \
  -quality 82 \
  -compression_level 6 \
  split-flap-demo.webp
```

Store the result at:

```text
docs/images/split-flap-demo.webp
```

## Troubleshooting

### Startup rows appear but no flap movement is visible

Confirm the browser console reports `v0.2.14`. The direct startup must use `initial_animation_style: direct` and a visible `initial_flip_duration`, for example `220`.

### A later sensor update temporarily shifts destination text

Use:

```yaml
live_update_style: direct
live_row_stagger: 0
```

Do not use a large `cell_stagger` to control startup timing. Use `initial_row_stagger` instead.

### HACS shows an older README

Choose **Update information** in the HACS repository menu, then reload the HACS page.

### The browser still runs an older JavaScript version

Perform a cache-free reload and verify:

```text
SPLIT-FLAP-DISPLAY-CARD v0.2.14
```

### A destination is truncated

Increase `board_columns.destination`. The total board width is recalculated automatically when `columns` is not specified manually.

## Development

Run syntax checks and regression tests:

```bash
npm run check
```

The regression tests verify that:

- a complete target snapshot is committed consistently;
- a newer sensor snapshot waits instead of interrupting the active transition;
- only the latest queued snapshot is applied after the current transition.

Repository structure:

```text
split-flap-display-card.js   Main custom element and startup controller
split-flap-config.js         Configuration validation and defaults
split-flap-render.js         DOM and physical-cell construction
split-flap-update.js         Snapshot queue and live-update animation engine
split-flap-styles.js         Instrument, flap and typography CSS
split-flap-utils.js          Tokens, colours and character sets
tests/                       Animation-state regression tests
examples/                    Fully commented Lovelace examples
docs/images/                 Real screenshots and branding
```

## Credits

The behaviour of existing Home Assistant split-flap projects, including `RazManSource/splitflap-card`, was reviewed as reference. This card uses an independent deterministic animation and snapshot engine.

The built-in S-Bahn badge is an original local rendering inspired by the familiar German green-circle-and-white-S convention. It does not download or bundle a third-party logo image.

## Licence

MIT
