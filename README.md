<p align="center">
  <img src="https://raw.githubusercontent.com/loungelizard2018/split-flap-display-card/main/docs/images/brand-icon.svg" alt="Split Flap Display Card logo" width="128">
</p>

# Split Flap Display Card

A photorealistic airport-style split-flap instrument for Home Assistant. The card combines a textured black aircraft-instrument housing, recessed bezel, optional cross-head screws and independently animated mechanical flap cells.

**Current release: v0.2.10**

> Every product image below is an actual screenshot of the card rendered in Home Assistant. No mockups or synthetic product visualisations are used.

## Real Home Assistant screenshots

### Public-transport departure board

The structured departure-board mode supports transport icons, a built-in German-style S-Bahn badge, a live header clock and colour-coded delay information.

![Real Home Assistant split-flap departure board with delay](https://raw.githubusercontent.com/loungelizard2018/split-flap-display-card/main/docs/images/real-departure-board-delay.webp)

### Free segment composition

Independent segments can combine time values, fixed text, numeric entity states, coloured units and MDI icons in one physical row.

![Real Home Assistant split-flap segment display](https://raw.githubusercontent.com/loungelizard2018/split-flap-display-card/main/docs/images/real-home-systems-segment.webp)

### Compact value instrument with screws

![Real compact split-flap temperature display with screws](https://raw.githubusercontent.com/loungelizard2018/split-flap-display-card/main/docs/images/real-temperature-screws.webp)

### Compact value instrument without screws

![Real compact split-flap temperature display without screws](https://raw.githubusercontent.com/loungelizard2018/split-flap-display-card/main/docs/images/real-temperature-no-screws.webp)

## Features

- Photorealistic black instrument housing matching the companion Analog Gauge Card and Mechanical Counter Card
- Independent upper and lower flap halves with a true two-stage `rotateX` animation
- Deterministic forward movement through an ordered physical character wheel
- Automatic first-load build from an empty board
- Row-atomic direct startup: complete destinations and line labels appear together instead of as partial words
- Optional wheel-style startup for a longer theatrical animation
- Optional click or keyboard replay for demonstrations and video recording
- Atomic live refresh handling so new sensor data cannot mix with an older animation
- Sequential, wave and simultaneous live-update behaviour
- Direct structured public-transport departure board without a template sensor
- Recognition of bus, S-Bahn, regional rail, long-distance rail, subway, tram and ferry services
- Built-in green S-Bahn badge
- Separate colours for normal, delayed and cancelled departures
- Free composition from text, spacers, entity states, attributes, friendly names, date/time values and MDI icons
- Responsive proportional fitting for desktop, tablet and mobile dashboards
- No external JavaScript or font dependencies at runtime

## Installation through HACS

1. Open **HACS → Dashboard**.
2. Open **Custom repositories**.
3. Add `https://github.com/loungelizard2018/split-flap-display-card` as category **Dashboard**.
4. Install or redownload **Split Flap Display Card**.
5. Select release **v0.2.10**.
6. Choose **Update information** if HACS still displays an older README.
7. Reload the Home Assistant frontend without browser cache.

HACS registers the main module at:

```text
/hacsfiles/split-flap-display-card/split-flap-display-card.js
```

The browser console should report:

```text
SPLIT-FLAP-DISPLAY-CARD v0.2.10
```

## First-load build animation

The card starts from empty flaps and builds the current display after a configurable delay.

The recommended `direct` style animates every populated cell in one row at the same time. Rows are then started from top to bottom. This keeps every visible destination, line and time internally complete throughout the animation.

```yaml
# Plays a mechanical build animation when the card is first rendered.
animate_on_first_load: true

# Selects how the initial empty board reaches the final values.
# direct: one clean flap from blank to the final value; recommended.
# wheel: advances every cell through the ordered character wheel.
initial_animation_style: direct

# Waits this many milliseconds before the first row starts moving.
initial_animation_delay: 450

# Duration in milliseconds of the direct blank-to-value flap.
initial_flip_duration: 180

# Character shown before the initial animation begins.
# A single space creates a completely empty board.
initial_fill_char: " "

# Allows replay by clicking the instrument or pressing Enter/Space.
# Leave false for a normal dashboard when replay is not needed.
replay_on_tap: false

# In direct startup mode this is the delay between complete rows.
# During later live updates it remains the delay between changed cells.
cell_stagger: 90
```

### Startup patterns

#### Complete rows, top to bottom

```yaml
# Uses one flap directly from blank to each final character.
initial_animation_style: direct

# Gives each complete row a clearly visible 90 ms start offset.
cell_stagger: 90
```

#### All rows almost simultaneously

```yaml
# Uses the clean row-atomic direct build.
initial_animation_style: direct

# Removes the delay between rows.
cell_stagger: 0
```

#### Full physical character wheel

```yaml
# Cycles every changed cell through the ordered character set.
initial_animation_style: wheel

# Starts changed cells independently.
start_mode: simultaneous

# Adds a short delay between individual cell starts.
cell_stagger: 4
```

## Video-recording configuration

Use this temporary configuration while recording the real card animation:

```yaml
# Registers the custom Lovelace card.
type: custom:split-flap-display-card

# Selects the structured departure-board renderer.
display_mode: departure_board

# Entity containing the departure array and station metadata.
entity: sensor.central_station_departures

# Attribute containing the structured departure records.
departure_attribute: departures

# Attribute used as the automatic subtitle.
station_name_attribute: station_name

# Main heading printed above the board.
title: DEPARTURES

# Number of physical rows shown in the recording.
visible_rows: 5

# Starts the board from empty flaps.
animate_on_first_load: true

# Uses the clean row-atomic startup animation.
initial_animation_style: direct

# Keeps the empty board visible for one second before movement starts.
initial_animation_delay: 1000

# Makes each row flap clearly visible in the video.
initial_flip_duration: 180

# Uses completely empty starting cells.
initial_fill_char: " "

# Lets a click replay the complete build without reloading the dashboard.
replay_on_tap: true

# Controls later live sensor changes after the startup animation.
start_mode: simultaneous

# Starts complete rows 90 ms apart during direct startup.
# Later live updates use the same value between individual changed cells.
cell_stagger: 90

# Duration of one physical character-wheel step during live updates.
step_duration: 58

# Duration of direct icon or special-token live-update flips.
flip_duration: 118

# Shrinks the full instrument proportionally to its Lovelace column.
fit_to_card: true

# Prevents enlargement above the natural physical size.
allow_upscale: false

# Shows the aircraft-instrument mounting screws.
screws: true

# Removes the normal Home Assistant card surface around the instrument.
transparent_card: true
```

The same fully commented configuration is stored at:

```text
examples/video-recording-demo.yaml
```

## Recording on macOS

1. Add the recording settings above to the card.
2. Open the dashboard and wait until the initial animation finishes.
3. Press `Cmd + Shift + 5`.
4. Select **Record Selected Portion**.
5. Draw the capture area tightly around the instrument.
6. Start recording.
7. Click the instrument once to replay the complete build.
8. Wait two seconds after the final row settles.
9. Stop recording from the macOS menu bar.
10. Trim the start and end in QuickTime Player.

### Convert the recording to MP4

```bash
# Converts a macOS MOV recording to a browser-compatible MP4.
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

### Convert the recording to animated WebP

```bash
# Creates a compact looping animation suitable for this README.
ffmpeg \
  -i input.mov \
  -vf "fps=20,scale=1200:-2:flags=lanczos" \
  -loop 0 \
  -c:v libwebp_anim \
  -quality 82 \
  -compression_level 6 \
  split-flap-demo.webp
```

Place the result at:

```text
docs/images/split-flap-demo.webp
```

Then embed it with:

```markdown
![Real Split Flap Display Card animation](https://raw.githubusercontent.com/loungelizard2018/split-flap-display-card/main/docs/images/split-flap-demo.webp)
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

# Attribute containing the list of departure records.
departure_attribute: departures

# Attribute used as the automatic subtitle.
station_name_attribute: station_name

# Main heading printed above the board.
title: DEPARTURES

# Optional fixed subtitle; leave empty to use station_name_attribute.
subtitle: ""

# Number of departure rows physically rendered.
visible_rows: 5

# Shows TIME, LINE, DESTINATION, PLATFORM and DELAY headings.
show_column_headers: true

# Shows the current Home Assistant local time in the top-right corner.
show_header_clock: true

# Builds complete rows from empty flaps when the page opens.
animate_on_first_load: true

# Uses one clean blank-to-value flap per populated cell.
initial_animation_style: direct

# Waits before the first row starts.
initial_animation_delay: 450

# Duration of the first-load flap.
initial_flip_duration: 180

# Uses empty starting cells.
initial_fill_char: " "

# Disables click-to-replay on a normal dashboard.
replay_on_tap: false

# Controls later live sensor changes.
start_mode: simultaneous

# Delays complete startup rows and later changed cells.
cell_stagger: 90

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
  # Bus symbol.
  bus: mdi:bus

  # Built-in green S-Bahn badge.
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

  # Fallback symbol for an unknown transport mode.
  unknown: mdi:transit-connection-variant
```

## Expected departure data

```yaml
# Human-readable station name used as the automatic subtitle.
station_name: Central Station

# List of upcoming departures rendered from top to bottom.
departures:
  - # Public line designation.
    line: S8

    # Destination shown in the destination field.
    destination: Airport

    # Realtime departure time displayed by the card.
    departure_time: "18:45"

    # Scheduled time used when no realtime value exists.
    planned_time: "18:43"

    # Delay in minutes; positive values are late.
    delay: 2

    # Platform, track or bus bay.
    platform: "3"

    # Generic transport type supplied by the integration.
    transportation_type: train

    # Indicates whether realtime information is available.
    is_realtime: true

    # Optional explicit cancellation flag.
    cancelled: false
```

The card uses `departure_time` first and falls back to `planned_time`. A positive delay is shown as `(+4)`. A cancellation is shown as `CANCEL`.

| Line or type | Detected mode |
|---|---|
| `S8`, `S23` | S-Bahn |
| `U2` | Subway |
| `RE1`, `RB48`, `IRE`, `MEX` | Regional train |
| `ICE`, `IC`, `EC` | Train |
| `transportation_type: bus` | Bus |
| `transportation_type: tram` | Tram |
| `transportation_type: ferry` | Ferry |

## Free segment mode

```yaml
# Registers the custom Lovelace card.
type: custom:split-flap-display-card

# Selects the free segment-composition renderer.
display_mode: segments

# Main title shown above the flap row.
title: HOME SYSTEMS

# Secondary heading shown below the title.
subtitle: MECHANICAL STATUS DISPLAY

# Total number of physical cells in the row.
columns: 30

# Builds the current values from an empty row.
animate_on_first_load: true

# Uses the clean direct startup.
initial_animation_style: direct

# Waits before the initial row moves.
initial_animation_delay: 450

# Duration of the initial direct flap.
initial_flip_duration: 180

# Enables fast later live updates.
start_mode: simultaneous

# Delay between later changed cells.
cell_stagger: 6

# Defines the physical display rows.
rows:
  - # Aligns combined row content from the left edge.
    align: left

    # Ordered independent content segments.
    segments:
      - # Displays a formatted date/time sensor value.
        type: datetime

        # Entity providing an ISO date/time state.
        entity: sensor.example_date_time

        # Formats the value as 24-hour hours and minutes.
        format: "HH:mm"

        # Reserves five cells for the time.
        width: 5

      - # Inserts a fixed empty segment.
        type: spacer

        # Inserts one empty physical cell.
        width: 1

      - # Displays fixed literal text.
        type: text

        # Text written across the reserved cells.
        value: HOME READY

        # Reserves twelve cells for the text.
        width: 12

      - # Inserts another empty physical cell.
        type: spacer

        # Number of empty cells inserted.
        width: 1

      - # Displays a numeric entity state.
        type: entity

        # Entity whose state is displayed.
        entity: sensor.example_temperature

        # Rounds numeric states to one decimal place.
        decimals: 1

        # Appends the temperature unit.
        suffix: "°C"

        # Reserves six cells for value and unit.
        width: 6

        # Right-aligns the value inside its reserved cells.
        align: right

        # Uses a light-blue glyph colour.
        color: "#79d7ff"

      - # Displays a fixed Material Design icon.
        type: icon

        # Icon rendered by Home Assistant.
        icon: mdi:home-outline

        # Reserves one cell for the icon.
        width: 1

        # Uses the same light-blue colour.
        color: "#79d7ff"
```

## Supported segment types

| Type | Purpose |
|---|---|
| `text` | Fixed literal text |
| `spacer` | Fixed number of empty cells |
| `entity` | Home Assistant entity state |
| `attribute` | One attribute from an entity |
| `friendly_name` | Entity `friendly_name` attribute |
| `datetime` | Formatted date/time state |
| `icon` | Fixed MDI icon |
| `entity_icon` | Icon read from an entity |

## Main options

| Option | Default | Description |
|---|---:|---|
| `display_mode` | `segments` | `segments` or `departure_board` |
| `animate_on_first_load` | `true` | Builds the display from the configured fill character |
| `initial_animation_style` | `direct` | `direct` or `wheel` |
| `initial_animation_delay` | `450` | Delay before the first-load build starts |
| `initial_flip_duration` | `136` | Duration of a direct startup flap |
| `initial_fill_char` | space | Initial character shown before startup |
| `replay_on_tap` | `false` | Replays the startup build on click or keyboard activation |
| `start_mode` | `sequential` | Later live-update mode: `sequential` or `simultaneous` |
| `max_parallel_cells` | `1` | Worker count in sequential live-update mode |
| `cell_stagger` | `18` | Row delay during direct startup; cell delay during later updates |
| `step_duration` | `72` | Duration of one character-wheel step |
| `flip_duration` | `136` | Duration of direct icon or special-token flips |
| `screws` | `true` | Shows four mounting screws |
| `fit_to_card` | `true` | Proportionally shrinks the instrument |
| `allow_upscale` | `false` | Allows enlargement above natural size |
| `visible_rows` | `8` | Number of departure-board rows |

## Update consistency

During direct startup, incoming Home Assistant refreshes are queued until the row-atomic build has finished. The newest sensor snapshot is then applied once. During later live operation, every new board snapshot cancels the older animation generation and starts from a stable cell state.

## Troubleshooting

### Only the first letters of destinations are visible during startup

Install v0.2.10 or newer and use:

```yaml
# Uses row-atomic blank-to-value animation.
initial_animation_style: direct

# Starts complete rows together.
cell_stagger: 90
```

Older versions staggered every individual cell and could therefore show partially built words during the recording.

### HACS shows an older README

Select **Update information** in HACS and reload the repository detail page.

### The browser still runs an older JavaScript version

Perform a cache-free reload and verify:

```text
SPLIT-FLAP-DISPLAY-CARD v0.2.10
```

### The departure board is blank

Confirm that:

- `entity` exists;
- `departure_attribute` points to an array;
- each record contains `line`, `destination` and either `departure_time` or `planned_time`.

## Development

```bash
npm run check
```

Repository structure:

```text
split-flap-display-card.js   Main custom element and startup controller
split-flap-config.js         Configuration validation and normalisation
split-flap-render.js         DOM and physical-cell construction
split-flap-update.js         Data adapters and live-update animation queue
split-flap-styles.js         Instrument, flap, typography and animation CSS
split-flap-utils.js          Tokens, colours, character sets and shared helpers
examples/                    Fully commented Lovelace examples
docs/images/                 Real screenshots and project branding
```

## Licence

MIT
