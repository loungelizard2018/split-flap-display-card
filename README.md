<p align="center">
  <img src="https://raw.githubusercontent.com/loungelizard2018/split-flap-display-card/main/docs/images/brand-icon.svg" alt="Split Flap Display Card logo" width="128">
</p>

# Split Flap Display Card

A photorealistic airport-style split-flap instrument for Home Assistant. The card combines a textured black aircraft-instrument housing, recessed bezel, optional cross-head screws and independently animated mechanical flap cells.

**Current release: v0.2.12**

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

- Photorealistic black instrument housing matching the companion Analog Gauge Card and Mechanical Counter Card
- Independent upper and lower flap halves with a true two-stage `rotateX` animation
- Deterministic forward movement through an ordered physical character wheel
- Structured public-transport departure board without a template sensor
- Recognition of bus, S-Bahn, regional rail, long-distance rail, subway, tram and ferry services
- Built-in green S-Bahn badge
- Separate colours for normal, delayed and cancelled departures
- Free composition from text, spacers, entity states, attributes, friendly names, date/time values and MDI icons
- Sequential, wave and simultaneous live-update behaviour
- Restart-safe first-load animation from an empty board
- Clean row reveal: no half-built destination words remain visible
- Optional click or keyboard replay for demonstrations and video recording
- Atomic live refresh handling so new sensor data cannot mix with an older animation
- Responsive proportional fitting for desktop, tablet and mobile dashboards
- No external JavaScript or font dependencies at runtime

## Installation through HACS

1. Open **HACS → Dashboard**.
2. Open **Custom repositories**.
3. Add `https://github.com/loungelizard2018/split-flap-display-card` as category **Dashboard**.
4. Install or redownload **Split Flap Display Card**.
5. Select release **v0.2.12**.
6. Choose **Update information** if HACS still displays an older README.
7. Reload the Home Assistant frontend without browser cache.

HACS registers the main module at:

```text
/hacsfiles/split-flap-display-card/split-flap-display-card.js
```

The browser console should report:

```text
SPLIT-FLAP-DISPLAY-CARD v0.2.12
```

## First-load build animation

The card can start with completely empty flap cells and mechanically build the current values after a configurable delay.

The recommended `direct` style uses a clean row reveal:

1. Every occupied cell in one row performs a blank mechanical flap.
2. The complete final row is committed in one browser frame.
3. The next row starts after `cell_stagger` milliseconds.
4. Home Assistant state updates received during the build are queued until the build is complete.
5. If Home Assistant temporarily detaches the card during dashboard layout, the animation restarts instead of remaining half-finished.

```yaml
# Plays a mechanical build animation when the card is first rendered.
animate_on_first_load: true

# Selects how the empty board reaches its final values.
# direct: clean complete-row reveal; recommended.
# wheel: every character travels through the ordered character wheel.
initial_animation_style: direct

# Waits this many milliseconds before the first row starts moving.
initial_animation_delay: 450

# Duration in milliseconds of the blank mechanical flap before a row appears.
initial_flip_duration: 220

# Character shown before the initial animation begins.
# A single space creates a completely empty board.
initial_fill_char: " "

# Allows replay by clicking the instrument or pressing Enter/Space.
# Leave false on normal dashboards when replay is not required.
replay_on_tap: false

# In direct startup mode this is the delay between complete rows.
# During later live updates it is the delay between changed cells.
cell_stagger: 120
```

### Alternative startup styles

```yaml
# Clean complete rows from top to bottom.
initial_animation_style: direct

# Gives each row a visible start offset.
cell_stagger: 120
```

```yaml
# Reveals all rows with almost no delay between them.
initial_animation_style: direct

# Removes the pause between complete rows.
cell_stagger: 0
```

```yaml
# Uses the full physical character wheel from blank to each target character.
initial_animation_style: wheel

# Starts changed cells independently.
start_mode: simultaneous

# Adds a short wave between individual cells.
cell_stagger: 4
```

## Complete departure-board example

This generic example assumes an entity named `sensor.central_station_departures` with a structured `departures` attribute.

```yaml
# Registers the custom Lovelace card.
type: custom:split-flap-display-card

# Selects the structured public-transport renderer.
display_mode: departure_board

# Entity containing departures and station metadata.
entity: sensor.central_station_departures

# Attribute containing the list of departure records.
departure_attribute: departures

# Attribute used as the automatic subtitle below the title.
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

# Shows the current Home Assistant local time in the top-right corner.
show_header_clock: true

# Builds the complete board from empty flaps when the page opens.
animate_on_first_load: true

# Uses the clean complete-row startup reveal.
initial_animation_style: direct

# Waits before the first row starts.
initial_animation_delay: 450

# Duration of the blank mechanical flap before each row appears.
initial_flip_duration: 220

# Uses empty starting cells.
initial_fill_char: " "

# Disables click-to-replay on a normal dashboard.
replay_on_tap: false

# Controls later live sensor changes.
start_mode: simultaneous

# Delays complete startup rows and later changed cells.
cell_stagger: 120

# Duration of one later character-wheel step.
step_duration: 58

# Duration of later direct icon or special-token flips.
flip_duration: 118

# Shrinks the instrument proportionally to the available width.
fit_to_card: true

# Prevents enlargement above the natural size.
allow_upscale: false

# Maximum enlargement factor when allow_upscale is enabled.
max_fit_scale: 1

# Shows four cross-head mounting screws.
screws: true

# Removes the normal Home Assistant card background.
transparent_card: true

# Natural width of one physical flap cell.
cell_width: 34

# Natural height of one physical flap cell.
cell_height: 50

# Horizontal space between adjacent cells.
cell_gap: 3

# Vertical space between rows.
row_gap: 8

# Font weight used for letters and numbers.
glyph_weight: 500

# Glyph size relative to the cell height.
glyph_scale: 0.61

# Vertical glyph adjustment.
glyph_offset_y: -1.5

# Configures physical field widths.
board_columns:
  # Cells reserved for the transport symbol.
  mode: 2

  # Cells reserved for the departure time.
  time: 5

  # Cells reserved for the line designation.
  line: 5

  # Cells reserved for the destination.
  destination: 20

  # Cells reserved for platform, track or bus bay.
  platform: 3

  # Cells reserved for delay or cancellation information.
  delay: 6

  # Empty cells inserted between adjacent fields.
  gap: 1

# Configures colours for structured departure data.
departure_colors:
  # Colour for normal route information.
  normal: "#f2c400"

  # Colour for delay values.
  delayed: "#ff5263"

  # Colour for cancelled departures.
  cancelled: "#ff3347"

  # Colour for column headings.
  header: "#aaa89e"

# Maps detected transport modes to icons.
transport_icon_map:
  # Standard bus symbol.
  bus: mdi:bus

  # Built-in green S-Bahn badge with a white S.
  sbahn: splitflap:sbahn

  # Generic train or long-distance rail symbol.
  train: mdi:train

  # Regional rail symbol.
  regional: mdi:train

  # Subway or underground symbol.
  subway: mdi:subway-variant

  # Tram or streetcar symbol.
  tram: mdi:tram

  # Ferry symbol.
  ferry: mdi:ferry

  # Fallback symbol for unknown transport types.
  unknown: mdi:transit-connection-variant
```

## Expected departure data

```yaml
# Human-readable station name used as the automatic subtitle.
station_name: Central Station

# List of departures rendered from top to bottom.
departures:
  - # Public line designation.
    line: S8

    # Destination shown in the destination field.
    destination: Airport

    # Realtime departure time displayed by the card.
    departure_time: "18:45"

    # Scheduled departure time used as a fallback.
    planned_time: "18:43"

    # Delay in minutes.
    delay: 2

    # Platform, track or bus bay.
    platform: "3"

    # Generic transport type supplied by the integration.
    transportation_type: train

    # Indicates whether realtime data is available.
    is_realtime: true

    # Optional explicit cancellation flag.
    cancelled: false
```

Common line detection:

| Line or type | Detected mode |
|---|---|
| `S8`, `S23` | S-Bahn |
| `U2` | Subway |
| `RE1`, `RB48`, `IRE`, `MEX` | Regional train |
| `ICE`, `IC`, `EC` | Train |
| `transportation_type: bus` | Bus |
| `transportation_type: tram` | Tram |
| `transportation_type: ferry` | Ferry |

A positive delay is shown as `(+4)`. A cancelled departure is shown as `CANCEL`.

## Free segment mode

```yaml
# Registers the custom Lovelace card.
type: custom:split-flap-display-card

# Selects free segment composition.
display_mode: segments

# Main title printed above the flap row.
title: HOME SYSTEMS

# Optional subtitle below the title.
subtitle: MECHANICAL STATUS DISPLAY

# Total number of physical cells in every row.
columns: 30

# Builds the current values from empty flaps.
animate_on_first_load: true

# Uses the clean row reveal.
initial_animation_style: direct

# Waits briefly before the reveal starts.
initial_animation_delay: 450

# Duration of the blank mechanical flap.
initial_flip_duration: 220

# Starts later live updates independently.
start_mode: simultaneous

# Adds a small wave to later changed cells.
cell_stagger: 6

# Defines the physical display rows.
rows:
  - # Aligns combined content from the left edge.
    align: left

    # Ordered independent segments in this row.
    segments:
      - # Displays a formatted date/time sensor value.
        type: datetime

        # Entity providing an ISO date/time state.
        entity: sensor.example_date_time

        # Formats the value as 24-hour hours and minutes.
        format: "HH:mm"

        # Reserves five physical cells.
        width: 5

      - # Inserts one empty cell.
        type: spacer

        # Number of empty cells inserted.
        width: 1

      - # Displays fixed literal text.
        type: text

        # Text written across the reserved cells.
        value: HOME READY

        # Reserves twelve cells.
        width: 12

      - # Inserts another empty cell.
        type: spacer

        # Number of empty cells inserted.
        width: 1

      - # Displays a numeric entity state.
        type: entity

        # Entity whose state is displayed.
        entity: sensor.example_temperature

        # Rounds numeric states to one decimal place.
        decimals: 1

        # Appends the unit after the value.
        suffix: "°C"

        # Reserves six cells for value and unit.
        width: 6

        # Right-aligns the value inside its cells.
        align: right

        # Uses a light-blue glyph colour.
        color: "#79d7ff"

      - # Displays a Material Design icon.
        type: icon

        # Icon rendered by Home Assistant.
        icon: mdi:home-outline

        # Reserves one physical cell.
        width: 1

        # Uses the same light-blue colour.
        color: "#79d7ff"
```

Supported segment types:

| Type | Purpose |
|---|---|
| `text` | Fixed literal text |
| `spacer` | Fixed number of empty cells |
| `entity` | Home Assistant entity state |
| `attribute` | One entity attribute |
| `friendly_name` | Entity `friendly_name` |
| `datetime` | Formatted date/time state |
| `icon` | Fixed MDI icon |
| `entity_icon` | Icon read from an entity |

Common segment fields:

| Field | Purpose |
|---|---|
| `width` | Number of physical cells reserved |
| `align` | `left`, `center` or `right` |
| `pad` | Character used to fill unused cells |
| `prefix` / `suffix` | Text added before or after the value |
| `uppercase` | Overrides card-wide uppercase conversion |
| `decimals` | Numeric decimal places |
| `decimal_separator` | Replaces the decimal point when set to `,` |
| `use_entity_unit` | Appends the entity unit |
| `unit_separator` | Text inserted before the entity unit |
| `color` | CSS colour used by the segment |

## Video-recording configuration

The fully commented recording example is stored at:

```text
examples/video-recording-demo.yaml
```

Recommended temporary settings:

```yaml
# Starts from an empty board.
animate_on_first_load: true

# Uses the clean row reveal.
initial_animation_style: direct

# Keeps the empty board visible for one second.
initial_animation_delay: 1000

# Makes the blank flap clearly visible in the recording.
initial_flip_duration: 220

# Allows replay by clicking the instrument.
replay_on_tap: true

# Starts complete rows 120 ms apart.
cell_stagger: 120
```

### Record on macOS

1. Open the dashboard and wait until the card is fully loaded.
2. Press `Cmd + Shift + 5`.
3. Select **Record Selected Portion**.
4. Draw the capture area tightly around the instrument.
5. Start recording.
6. Click the instrument once.
7. Wait two seconds after the final row appears.
8. Stop the recording from the macOS menu bar.
9. Trim the beginning and end in QuickTime Player.

The replay control uses an accessibility label only. It does not display a browser tooltip over the recording.

### Convert MOV to MP4

```bash
# Converts a macOS recording to a browser-compatible MP4.
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
# Creates a compact looping animation for the README.
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

### Only the first letters of destination words remain visible

That was the interrupted midpoint state fixed in v0.2.12. Confirm the browser console reports `v0.2.12`, then perform a cache-free reload. The direct startup now animates blank flap surfaces and commits each complete row only after all cell movements finish.

### Clicking replay corrects the text but no movement is visible

Confirm:

```yaml
replay_on_tap: true
initial_animation_style: direct
initial_flip_duration: 220
initial_animation_delay: 1000
```

The board should first become empty, wait for the configured delay and then reveal complete rows.

### HACS shows an older README

Use **Update information** in the HACS repository menu and reload the HACS page.

### The browser runs an older JavaScript version

Perform a cache-free reload and verify:

```text
SPLIT-FLAP-DISPLAY-CARD v0.2.12
```

### A destination is truncated

Increase `board_columns.destination`. The total board width is calculated automatically when `columns` is not set manually.

## Development

Run syntax checks before committing:

```bash
npm run check
```

Repository structure:

```text
split-flap-display-card.js   Main custom element and startup controller
split-flap-config.js         Configuration validation and normalisation
split-flap-render.js         DOM and physical-cell construction
split-flap-update.js         Data adapters and live-update animation engine
split-flap-styles.js         Instrument, flap and typography CSS
split-flap-utils.js          Tokens, colours and character sets
examples/                    Fully commented Lovelace examples
docs/images/                 Real screenshots and branding
```

## Credits

The behaviour of existing Home Assistant split-flap projects, including `RazManSource/splitflap-card`, was reviewed as reference. This card uses an independent deterministic animation engine rather than random character scrambling.

The built-in S-Bahn badge is an original local rendering inspired by the familiar German green-circle-and-white-S convention. It does not download or bundle a third-party logo image.

## Licence

MIT
