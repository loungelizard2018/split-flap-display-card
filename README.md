<p align="center">
  <img src="https://raw.githubusercontent.com/loungelizard2018/split-flap-display-card/main/docs/images/brand-icon.svg" alt="Split Flap Display Card logo" width="128">
</p>

# Split Flap Display Card

A photorealistic airport-style split-flap instrument for Home Assistant. It combines a textured black aircraft-instrument housing, recessed bezel, optional cross-head screws and independently animated mechanical flap cells.

**Current release: v0.2.23**

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
- Visible mechanical flap motion even when the browser reports reduced-motion preferences
- Direct structured public-transport board without a template sensor
- Bus, S-Bahn, regional rail, train, subway, tram and ferry classification
- Built-in green S-Bahn badge
- Separate colours for normal, delayed and cancelled departures
- Flexible text, spacer, entity, attribute, date/time and MDI-icon segments
- First-load animation from a completely empty board
- Separate timing controls for startup rows and later live updates
- Snapshot queue for Home Assistant state changes received during an active animation
- Row-atomic live updates that cannot mix two departure snapshots
- Optional full character-wheel animation
- Optional click or keyboard replay for demonstrations and recordings
- Responsive proportional scaling for desktop, tablet and mobile dashboards
- No external JavaScript or font dependencies at runtime

## Installation through HACS

1. Open **HACS → Dashboard**.
2. Open **Custom repositories**.
3. Add `https://github.com/loungelizard2018/split-flap-display-card` as category **Dashboard**.
4. Install or redownload **Split Flap Display Card**.
5. Select release **v0.2.23**.
6. Choose **Update information** if HACS still displays an older README.
7. Reload the Home Assistant frontend without browser cache.

HACS registers:

```text
/hacsfiles/split-flap-display-card/split-flap-display-card.js
```

The browser console must report:

```text
SPLIT-FLAP-DISPLAY-CARD v0.2.23
```

## Transport badges

### Built-in German transport badges

The departure-board mode can render local vector/CSS badges without external image requests:

- green circular **S** for S-Bahn;
- blue square **U** for U-Bahn;
- light **ICE/ECE** and **IC/EC** wordmarks with a red lower stripe;
- compact **RE**, **RB**, **IRE** or **MEX** regional badges selected from the line prefix.

These are original card renderings inspired by familiar German transport signage. They are not official operator logo files.

## Animation model

Startup and later sensor updates are handled separately.

### First-load startup

`initial_animation_style: direct` starts with empty cells and performs one actual split-flap movement from blank to the final character. All populated cells in one row move together. Complete rows follow one another using `initial_row_stagger`.

```yaml
# Builds the display from empty cells when the card first appears.
animate_on_first_load: true

# direct: one physical blank-to-final flap per changed cell.
# wheel: each cell advances through the full ordered character wheel.
initial_animation_style: direct

# Keeps the empty board visible before movement begins.
initial_animation_delay: 1000

# Duration in milliseconds of one startup flap.
# 260 is suitable for normal use; 400-500 is useful for recording.
initial_flip_duration: 260

# Delay between complete startup rows.
# This does not affect later sensor updates.
initial_row_stagger: 150

# Empty initial character.
initial_fill_char: " "

# Allows replay by clicking the instrument or pressing Enter/Space.
replay_on_tap: true
```

Version 0.2.15 explicitly keeps the CSS flap duration synchronised with `initial_flip_duration` and `flip_duration`. Earlier versions could reduce the visual CSS animation to 1 ms while JavaScript still waited for the configured duration. The result looked like complete rows appearing after a delay without any visible flap motion.

### Varied wheel startup

For a lively but readable airport-board effect, use the bounded short-wheel mode. Each cell shows only a few mechanically adjacent characters before its target, and the number of simultaneously moving cells is limited.

```yaml
# Uses visible mechanical character changes.
initial_animation_style: wheel

# mixed: loose row order plus restrained per-cell variation.
initial_start_pattern: mixed

# Base offset between rows.
initial_row_stagger: 80

# Small additional start variation; avoid very large values such as 500+ ms.
initial_start_spread: 220

# short prevents the whole alphabet from flashing through every cell.
# full preserves the complete physical wheel for specialist demonstrations.
initial_wheel_mode: short

# Each cell shows three to six intermediate characters before settling.
initial_wheel_steps_min: 3
initial_wheel_steps_max: 6

# Limits simultaneous movement and removes the dark full-board flicker.
initial_max_parallel_cells: 28

# Duration of one visible wheel step.
step_duration: 50
```

The short sequences remain deterministic for one replay and vary again on the next replay. Live sensor updates remain controlled separately by `live_update_style`.

### Live sensor updates

Public-transport boards default to stable direct updates. Every changed cell performs one flap from its current value to its new value. A complete sensor snapshot finishes before the newest queued snapshot starts.

```yaml
# direct: one flap from the current value to the new value.
# wheel: advances through the ordered character wheel.
live_update_style: direct

# Starts changed rows together.
start_mode: simultaneous

# Optional delay between changed rows during direct updates.
live_row_stagger: 0

# Used only for individual cells in wheel mode.
cell_stagger: 4

# Duration of one direct live-update flap.
flip_duration: 118

# Duration of one character-wheel step.
step_duration: 58
```

## Complete departure-board example

This generic example assumes an entity called `sensor.central_station_departures` with a structured `departures` attribute.

```yaml
# Registers the custom Lovelace card.
type: custom:split-flap-display-card

# Selects the structured public-transport renderer.
display_mode: departure_board

# Entity containing departures and station metadata.
entity: sensor.central_station_departures

# Attribute containing the departure records.
departure_attribute: departures

# Attribute used as the automatic subtitle.
station_name_attribute: station_name

# Main heading printed above the board.
title: DEPARTURES

# Optional fixed subtitle.
# Leave empty to use station_name_attribute automatically.
subtitle: ""

# Number of physical departure rows.
visible_rows: 5

# Shows TIME, LINE, DESTINATION, PLATFORM and DELAY headings.
show_column_headers: true

# Shows the current Home Assistant local time.
show_header_clock: true

# Builds the board from empty cells when the page opens.
animate_on_first_load: true

# Uses one actual blank-to-final flap per populated cell.
initial_animation_style: direct

# Waits before the first row begins.
initial_animation_delay: 1000

# Duration of each startup flap.
initial_flip_duration: 260

# Delay between complete startup rows.
initial_row_stagger: 150

# Empty startup character.
initial_fill_char: " "

# Enables click-to-replay for demonstrations and recording.
replay_on_tap: true

# Uses stable row-atomic live updates.
live_update_style: direct

# Starts changed live rows together.
start_mode: simultaneous

# No delay between changed live rows.
live_row_stagger: 0

# Used only when live_update_style is wheel.
cell_stagger: 4

# Duration of direct live-update flaps.
flip_duration: 118

# Duration of one wheel step.
step_duration: 58

# Shrinks the complete instrument to the available Lovelace width.
fit_to_card: true

# Prevents enlargement above the natural size.
allow_upscale: false

# Maximum enlargement factor if allow_upscale is enabled.
max_fit_scale: 1

# Shows the four mounting screws.
screws: true

# Removes the normal Home Assistant card surface.
transparent_card: true

# Natural width of one physical flap cell.
cell_width: 34

# Natural height of one physical flap cell.
cell_height: 50

# Horizontal gap between adjacent cells.
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

  # Built-in green German S-Bahn badge.
  sbahn: splitflap:sbahn

  # Built-in ICE/ECE badge with a light body and red stripe.
  ice: splitflap:ice

  # Built-in IC/EC badge with a light body and red stripe.
  ic: splitflap:ic

  # Generic train symbol for unclassified rail services.
  train: mdi:train

  # Built-in RE/RB/IRE/MEX badge; the line prefix is selected automatically.
  regional: splitflap:regional

  # Built-in blue German U-Bahn badge.
  subway: splitflap:ubahn

  # Tram or streetcar.
  tram: mdi:tram

  # Ferry.
  ferry: mdi:ferry

  # Fallback for unknown modes.
  unknown: mdi:transit-connection-variant
```

The fully commented version is stored at:

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

    # Realtime departure time.
    departure_time: "18:45"

    # Scheduled fallback time.
    planned_time: "18:43"

    # Delay in minutes.
    delay: 2

    # Platform, track or bus bay.
    platform: "3"

    # Generic transport type supplied by the integration.
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
| `U2` | German U-Bahn badge |
| `RE1`, `RB48`, `IRE`, `MEX` | Prefix-specific regional badge |
| `ICE`, `ECE` | ICE/ECE badge |
| `IC`, `EC` | IC/EC badge |
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
initial_flip_duration: 260

# Delay between startup rows.
initial_row_stagger: 120

# Uses full wheel movement for later segment changes.
live_update_style: wheel

# Starts changed wheel cells independently.
start_mode: simultaneous

# Short wave between changed wheel cells.
cell_stagger: 6

# Defines display rows.
rows:
  - # Aligns combined content from the left.
    align: left

    # Ordered independent segments.
    segments:
      - # Formatted date/time entity.
        type: datetime
        entity: sensor.example_date_time
        format: "HH:mm"
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

## Video recording

Use these temporary options:

```yaml
# Starts from an empty board.
animate_on_first_load: true

# Shows real blank-to-final flap movement.
initial_animation_style: direct

# Keeps the empty board visible for one second.
initial_animation_delay: 1000

# Slower movement for a clearly visible recording.
initial_flip_duration: 450

# Starts complete rows 180 ms apart.
initial_row_stagger: 180

# Allows replay by clicking the instrument.
replay_on_tap: true

# Keeps later sensor updates compact and stable.
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
7. Wait two seconds after the final row settles.
8. Stop from the macOS menu bar.
9. Trim the beginning and end in QuickTime Player.

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

### Startup animation repeats instead of settling

The startup build is deliberately one-shot. If a browser timer is interrupted or Home Assistant briefly reattaches the card, the animation stops retrying and the card settles immediately on the latest complete sensor snapshot. It will only run again after a page reload or an explicit click when `replay_on_tap: true`.


### Rows appear one after another but no flap movement is visible

Install v0.2.15 and verify the browser console reports `v0.2.15`. Earlier versions could apply a reduced-motion CSS duration of 1 ms while the JavaScript controller still waited for the full configured duration.

For a deliberately obvious test use:

```yaml
initial_animation_style: direct
initial_flip_duration: 500
initial_row_stagger: 200
replay_on_tap: true
```

### A later sensor update temporarily shifts destination text

Use:

```yaml
live_update_style: direct
start_mode: simultaneous
live_row_stagger: 0
```

Use `initial_row_stagger` rather than a large `cell_stagger` for the first-load sequence.

### HACS shows an older README

Choose **Update information** in the HACS repository menu, then reload the HACS page.

### The browser still runs an older JavaScript version

Perform a cache-free reload and verify:

```text
SPLIT-FLAP-DISPLAY-CARD v0.2.15
```

### A destination is truncated

Increase `board_columns.destination`. The total board width is recalculated automatically when `columns` is not specified manually.

## Development

Run syntax checks and regression tests:

```bash
npm run check
```

The tests verify that:

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
