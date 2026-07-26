<p align="center">
  <img src="https://raw.githubusercontent.com/loungelizard2018/split-flap-display-card/main/docs/images/brand-icon.svg" alt="Split Flap Display Card logo" width="128">
</p>

# Split Flap Display Card

A photorealistic airport-style split-flap instrument for Home Assistant. It combines a textured black aircraft-instrument housing, recessed bezel, optional cross-head screws and independently animated mechanical flap cells.

**Current release: v0.2.7**

> Every product image below is an actual screenshot of the card rendered in Home Assistant. No mockups or synthetic product visualisations are used.

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

- Photorealistic black instrument housing matching the companion Analog Gauge Card and Mechanical Counter Card
- Independent upper and lower flap halves with a true two-stage `rotateX` animation
- Deterministic forward movement through a physical character wheel instead of random scrambling
- Reliable first-load animation from an empty board to the complete current state
- Direct first-load mode that reveals complete characters with one flap instead of temporarily showing partial words
- Optional wheel-style first-load mode for a longer mechanical character-wheel demonstration
- Optional click or keyboard replay for demonstrations and video recording
- Atomic refresh handling so a new sensor update cannot mix characters from old and new rows
- Sequential, overlapping-wave and simultaneous start behaviour
- Direct structured departure-board mode without a template sensor
- Automatic recognition of bus, S-Bahn, regional train, long-distance train, subway, tram and ferry services
- Built-in green S-Bahn badge inspired by the familiar German S-Bahn visual language
- Separate colours for normal, delayed and cancelled departures
- Free composition from text, spacers, entity states, attributes, friendly names, date/time values and MDI icons
- Per-segment width, alignment, padding, prefixes, suffixes, numeric formatting and colour
- Responsive proportional fitting for desktop, tablet and mobile dashboards
- No external JavaScript, image or font dependencies at runtime

## Installation through HACS

1. Open **HACS → Dashboard**.
2. Open **Custom repositories**.
3. Add `https://github.com/loungelizard2018/split-flap-display-card` as category **Dashboard**.
4. Install or redownload **Split Flap Display Card**.
5. Select release **v0.2.7**.
6. Choose **Update information** if HACS still displays an older README.
7. Reload the Home Assistant frontend without browser cache.

HACS registers the main module at:

```text
/hacsfiles/split-flap-display-card/split-flap-display-card.js
```

The browser console should report:

```text
SPLIT-FLAP-DISPLAY-CARD v0.2.7
```

## First-load build animation

The card starts from empty flaps and builds the current display after a configurable delay. Version 0.2.7 introduces a direct build as the default. Every populated cell performs one complete flap from blank to its final character. This prevents the temporary half-built words that occur when every cell has to travel through the complete alphabet from a blank starting position.

```yaml
# Plays a mechanical build animation when the card is first rendered.
animate_on_first_load: true

# Selects how the initial empty board reaches the final values.
# direct: one clean flap from blank to the final character; recommended.
# wheel: advances through the ordered character wheel; slower and more theatrical.
initial_animation_style: direct

# Waits this many milliseconds before the first flap starts moving.
# Increase this value when preparing a screen recording.
initial_animation_delay: 450

# Duration in milliseconds of the direct first-load flap.
# This affects only initial_animation_style: direct.
initial_flip_duration: 136

# Character shown before the first-load animation begins.
# A single space creates a completely empty board.
initial_fill_char: " "

# Allows the animation to be replayed by clicking the instrument or pressing Enter.
# This is intended primarily for demonstrations and recording.
replay_on_tap: false
```

### Recommended settings for recording

```yaml
# Builds the complete board from empty cells after page load.
animate_on_first_load: true

# Uses one clean flap per final character.
initial_animation_style: direct

# Keeps the empty board visible for one second before movement begins.
initial_animation_delay: 1000

# Gives each direct reveal a clearly visible mechanical duration.
initial_flip_duration: 150

# Starts from an empty mechanical board.
initial_fill_char: " "

# Lets you replay the build without reloading the dashboard.
replay_on_tap: true

# Starts populated cells independently with a short mechanical wave.
start_mode: simultaneous

# Adds six milliseconds between adjacent cell starts.
cell_stagger: 6
```

When `replay_on_tap: true` is enabled, click anywhere on the instrument to reset it to the configured fill character and replay the full build. Keyboard users can focus the instrument and press **Enter** or **Space**.

A fully commented recording configuration is available at:

```text
examples/video-recording-demo.yaml
```

## Complete departure-board example

This generic example assumes an entity called `sensor.central_station_departures` whose `departures` attribute contains structured departure records.

```yaml
# Registers the custom Lovelace card.
type: custom:split-flap-display-card

# Selects the structured public-transport board renderer.
display_mode: departure_board

# Entity containing the departure list and station metadata.
entity: sensor.central_station_departures

# Attribute containing the list of departure records.
departure_attribute: departures

# Attribute used as the automatic subtitle below the card title.
station_name_attribute: station_name

# Main title printed in the instrument heading.
title: DEPARTURES

# Optional fixed subtitle; leave empty to use station_name_attribute automatically.
subtitle: ""

# Number of departure rows physically rendered by the card.
visible_rows: 5

# Shows the TIME, LINE, DESTINATION, PLATFORM and DELAY headings.
show_column_headers: true

# Shows the current Home Assistant local time in the top-right corner.
show_header_clock: true

# Builds the complete current board when the page is first opened.
animate_on_first_load: true

# Reveals every final character with one direct mechanical flap.
initial_animation_style: direct

# Waits before starting the first-load build.
initial_animation_delay: 450

# Controls the duration of each direct first-load flap.
initial_flip_duration: 136

# Starts from visually empty cells.
initial_fill_char: " "

# Keeps click-to-replay disabled on a normal dashboard.
replay_on_tap: false

# Starts all changed cells independently instead of waiting for the prior cell.
start_mode: simultaneous

# Adds a short delay between cell starts; 0 means exactly simultaneous.
cell_stagger: 4

# Duration in milliseconds of one character-wheel step during live updates.
step_duration: 58

# Duration in milliseconds for direct icon or special-token flaps.
flip_duration: 118

# Shrinks the complete physical instrument proportionally to the card width.
fit_to_card: true

# Prevents enlargement above the natural physical instrument size.
allow_upscale: false

# Maximum enlargement factor when allow_upscale is enabled.
max_fit_scale: 1

# Shows four aircraft-instrument-style cross-head screws.
screws: true

# Removes the normal Home Assistant card background around the instrument.
transparent_card: true

# Natural width of one physical flap cell before responsive scaling.
cell_width: 34

# Natural height of one physical flap cell before responsive scaling.
cell_height: 50

# Horizontal space between adjacent physical cells.
cell_gap: 3

# Vertical space between departure rows.
row_gap: 8

# Font weight used for letters and numbers on every flap.
glyph_weight: 500

# Character size as a fraction of the configured cell height.
glyph_scale: 0.61

# Vertical character offset; the default keeps E, F and H centre strokes visible.
glyph_offset_y: -1.5

# Configures the physical width of each departure-board field.
board_columns:
  # Number of cells reserved for the transport symbol.
  mode: 2

  # Number of cells reserved for the departure time.
  time: 5

  # Number of cells reserved for the line designation.
  line: 5

  # Number of cells reserved for the destination text.
  destination: 20

  # Number of cells reserved for the platform or bay.
  platform: 3

  # Number of cells reserved for delay or cancellation information.
  delay: 6

  # Number of empty physical cells inserted between adjacent fields.
  gap: 1

# Controls the text colours used by structured departure rows.
departure_colors:
  # Colour for on-time departures and normal route information.
  normal: "#f2c400"

  # Colour for positive or negative delay values.
  delayed: "#ff5263"

  # Colour for cancelled departures.
  cancelled: "#ff3347"

  # Colour for the column headings above the flap rows.
  header: "#aaa89e"

# Maps detected transport modes to built-in or Material Design icons.
transport_icon_map:
  # Standard bus symbol.
  bus: mdi:bus

  # Built-in green S-Bahn badge with a white S.
  sbahn: splitflap:sbahn

  # Generic train or long-distance rail symbol.
  train: mdi:train

  # Regional rail symbol used for RE, RB, R, IRE and MEX lines.
  regional: mdi:train

  # Subway or underground symbol.
  subway: mdi:subway-variant

  # Tram or streetcar symbol.
  tram: mdi:tram

  # Ferry symbol.
  ferry: mdi:ferry

  # Fallback symbol when no transport type can be classified.
  unknown: mdi:transit-connection-variant
```

## Expected departure data

The card reads an array from the configured `departure_attribute`. Each record may contain the fields below.

```yaml
# Human-readable station name used as the automatic subtitle.
station_name: Central Station

# List of upcoming departures rendered from top to bottom.
departures:
  # First departure record.
  - # Public line designation.
    line: S8

    # Destination shown in the destination field.
    destination: Airport

    # Realtime departure time displayed by the card.
    departure_time: "18:45"

    # Scheduled departure time used when no realtime time is available.
    planned_time: "18:43"

    # Delay in minutes; positive values are late and negative values are early.
    delay: 2

    # Platform, track or bus bay text.
    platform: "3"

    # Generic mode supplied by the integration.
    transportation_type: train

    # Indicates whether realtime information was available.
    is_realtime: true

    # Optional explicit cancellation flag.
    cancelled: false
```

The board uses `departure_time` first and falls back to `planned_time`. It recognises common line prefixes in addition to `transportation_type`:

| Line or type | Detected mode |
|---|---|
| `S8`, `S23` | S-Bahn |
| `U2` | Subway |
| `RE1`, `RB48`, `IRE`, `MEX` | Regional train |
| `ICE`, `IC`, `EC` | Train |
| `transportation_type: bus` | Bus |
| `transportation_type: tram` | Tram |
| `transportation_type: ferry` | Ferry |

A positive delay is shown as `(+4)`. A cancellation is shown as `CANCEL`. Only the delay or cancellation field changes to the configured warning colour.

## Live-update animation modes

The first-load direct build is independent of later live updates. Live text changes continue to move through the ordered physical character wheel.

### Strictly sequential

```yaml
# Starts changed cells through a bounded worker queue.
start_mode: sequential

# Allows exactly one physical cell to animate at a time.
max_parallel_cells: 1

# Waits this many milliseconds before starting the next changed cell.
cell_stagger: 60
```

### Mechanical wave

```yaml
# Starts every changed cell independently.
start_mode: simultaneous

# Introduces a short left-to-right and top-to-bottom start wave.
cell_stagger: 4
```

### Fully simultaneous

```yaml
# Starts every changed cell independently.
start_mode: simultaneous

# Removes all delay between cell starts.
cell_stagger: 0
```

## Free segment mode

```yaml
# Registers the custom Lovelace card.
type: custom:split-flap-display-card

# Selects the free segment-composition renderer.
display_mode: segments

# Main title printed above the flap rows.
title: HOME SYSTEMS

# Optional secondary heading below the title.
subtitle: MECHANICAL STATUS DISPLAY

# Total number of physical flap cells in every row.
columns: 30

# Builds the current values from an empty board after the card loads.
animate_on_first_load: true

# Uses one direct flap from empty to every final character.
initial_animation_style: direct

# Waits briefly before the first-load animation starts.
initial_animation_delay: 450

# Duration of each direct first-load flap.
initial_flip_duration: 136

# Starts changed cells independently for a fast mechanical wave.
start_mode: simultaneous

# Adds a small start delay between adjacent changed cells.
cell_stagger: 6

# Defines the physical rows shown by the card.
rows:
  # First physical display row.
  - # Aligns the combined row content from the left edge.
    align: left

    # Ordered independent content segments in this row.
    segments:
      # Displays a formatted date/time sensor value.
      - # Selects the date/time formatter.
        type: datetime

        # Entity providing an ISO date/time state.
        entity: sensor.example_date_time

        # Output pattern using 24-hour time.
        format: "HH:mm"

        # Reserves five physical cells for the formatted time.
        width: 5

      # Inserts one empty physical flap cell.
      - # Selects a fixed empty segment.
        type: spacer

        # Number of empty physical cells inserted.
        width: 1

      # Displays fixed text.
      - # Selects a literal text segment.
        type: text

        # Text written across the reserved cells.
        value: HOME READY

        # Reserves twelve cells and pads unused cells with spaces.
        width: 12

      # Inserts another empty physical flap cell.
      - # Selects a fixed empty segment.
        type: spacer

        # Number of empty physical cells inserted.
        width: 1

      # Displays a numeric Home Assistant entity.
      - # Selects an entity-state segment.
        type: entity

        # Entity whose state is displayed.
        entity: sensor.example_temperature

        # Rounds numeric states to one decimal place.
        decimals: 1

        # Appends the configured unit text after the value.
        suffix: "°C"

        # Reserves six physical cells for value and unit.
        width: 6

        # Right-aligns the formatted value inside the reserved cells.
        align: right

        # Uses a light blue character colour for this segment.
        color: "#79d7ff"

      # Displays a Material Design icon in one physical cell.
      - # Selects a fixed icon segment.
        type: icon

        # Material Design icon name rendered by Home Assistant.
        icon: mdi:home-outline

        # Reserves one physical cell for the icon.
        width: 1

        # Uses the same light blue colour as the temperature segment.
        color: "#79d7ff"
```

## Supported segment types

| Type | Purpose |
|---|---|
| `text` | Fixed literal text |
| `spacer` | Fixed number of empty cells |
| `entity` | Home Assistant entity state |
| `attribute` | One attribute from a Home Assistant entity |
| `friendly_name` | Entity `friendly_name` attribute |
| `datetime` | Formatted date/time state |
| `icon` | Fixed MDI icon |
| `entity_icon` | Icon read from an entity |

## Common segment fields

| Field | Purpose |
|---|---|
| `width` | Number of physical cells reserved by the segment |
| `align` | `left`, `center` or `right` alignment inside the reserved cells |
| `pad` | Character used to fill unused cells |
| `prefix` / `suffix` | Text added before or after the source value |
| `uppercase` | Overrides the card-wide uppercase conversion |
| `overflow` | Clips text that exceeds `width` |
| `decimals` | Numeric decimal places for entity values |
| `decimal_separator` | Set to `,` to replace the decimal point |
| `use_entity_unit` | Appends `unit_of_measurement` from the entity |
| `unit_separator` | Text inserted before the entity unit |
| `color` | CSS colour used by the segment glyphs |

## Card options reference

### General and housing

| Option | Default | Description |
|---|---:|---|
| `display_mode` | `segments` | `segments` or `departure_board` |
| `title` | mode-dependent | Main heading |
| `subtitle` | empty | Fixed secondary heading; overrides station metadata |
| `screws` | `true` | Shows four instrument screws |
| `transparent_card` | `true` | Removes the normal Home Assistant card surface |
| `fit_to_card` | `true` | Proportionally shrinks the complete instrument |
| `allow_upscale` | `false` | Allows enlargement above natural size |
| `max_fit_scale` | `1` | Maximum enlargement factor |

### Initial build and replay

| Option | Default | Description |
|---|---:|---|
| `animate_on_first_load` | `true` | Builds the current display from the configured fill character when the card first renders |
| `initial_animation_style` | `direct` | `direct` reveals final characters with one flap; `wheel` traverses the character wheel |
| `initial_animation_delay` | `450` | Delay in milliseconds before the initial build begins |
| `initial_flip_duration` | `136` | Direct first-load flap duration in milliseconds |
| `initial_fill_char` | space | Single character displayed before the initial build |
| `replay_on_tap` | `false` | Replays the complete build when the instrument is clicked or activated by keyboard |

### Cell geometry and typography

| Option | Default | Description |
|---|---:|---|
| `cell_width` | `34` | Natural cell width in pixels |
| `cell_height` | `50` | Natural cell height in pixels |
| `cell_gap` | `3` | Horizontal gap between cells |
| `row_gap` | `8` | Vertical gap between rows |
| `text_color` | `#f2f1e9` | Default segment-mode glyph colour |
| `glyph_weight` | `500` | Glyph font weight |
| `glyph_scale` | `0.61` | Glyph size relative to cell height |
| `glyph_offset_y` | `-1.5` | Vertical glyph adjustment |
| `character_set` | `airport_de` | Ordered physical character wheel |
| `uppercase` | `true` | Converts segment text to uppercase |

### Animation

| Option | Default | Description |
|---|---:|---|
| `start_mode` | `sequential` | `sequential` or `simultaneous` |
| `max_parallel_cells` | `1` | Worker count in sequential mode |
| `cell_stagger` | `18` | Start delay in milliseconds |
| `step_duration` | `72` | Duration of one character-wheel step |
| `flip_duration` | `136` | Duration of direct icon or special-token flips |

### Departure-board data and layout

| Option | Default | Description |
|---|---:|---|
| `entity` | required | Entity containing departure data |
| `departure_attribute` | `departures` | Attribute containing the departure array |
| `station_name_attribute` | `station_name` | Attribute used as the automatic subtitle |
| `visible_rows` | `8` | Number of physical departure rows |
| `show_column_headers` | `true` | Shows board field headings |
| `show_header_clock` | `true` | Shows current Home Assistant local time |
| `board_columns` | see example | Physical field widths and gaps |
| `departure_colors` | see example | Normal, delayed, cancelled and heading colours |
| `transport_icon_map` | built in | Transport-mode icon overrides |

## Recording a real animation video

1. Install v0.2.7 and use the recording settings shown above.
2. Open the dashboard and wait until the card has loaded.
3. Press `Cmd + Shift + 5` on macOS.
4. Select **Record Selected Portion**.
5. Draw the capture area tightly around the instrument.
6. Start recording.
7. Click the card once to replay the direct build animation.
8. Wait one or two seconds after the final flap settles.
9. Stop the recording from the macOS menu bar.

macOS saves a `.mov` file. Trim the beginning and end in QuickTime Player before conversion.

### Create an MP4 with ffmpeg

```bash
# Converts the macOS recording to a browser-compatible MP4.
# Replace input.mov with the actual recording filename.
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

### Create a high-quality animated WebP

Animated WebP is usually much smaller and sharper than GIF for this dark, detailed interface.

```bash
# Creates a looping animated WebP suitable for the GitHub README.
ffmpeg \
  -i input.mov \
  -vf "fps=20,scale=1200:-2:flags=lanczos" \
  -loop 0 \
  -c:v libwebp_anim \
  -quality 82 \
  -compression_level 6 \
  split-flap-demo.webp
```

Place the resulting file at:

```text
docs/images/split-flap-demo.webp
```

Then add it to the README with:

```markdown
![Real Split Flap Display Card animation](https://raw.githubusercontent.com/loungelizard2018/split-flap-display-card/main/docs/images/split-flap-demo.webp)
```

## Update consistency

Home Assistant integrations often replace the complete departure list while the previous flap animation is still running. The card treats every new data snapshot atomically:

1. It invalidates the prior animation generation.
2. It cancels pending timers.
3. It returns any half-flipped cell to a stable state.
4. It assigns the complete new target board.
5. It starts a fresh animation only from the stable current state.

This prevents destinations from different snapshots being combined within one row.

## Troubleshooting

### The first-load display temporarily shows only some letters

Install v0.2.7 and use:

```yaml
initial_animation_style: direct
```

The older wheel-style first-load animation intentionally required different letters to travel different distances through the character wheel, so short-target letters appeared before later letters. Direct mode makes every populated cell perform exactly one flap and complete cleanly.

### The initial animation does not play

Confirm that `animate_on_first_load: true` is present or left at its default. Perform a full dashboard reload rather than only opening the card editor. For repeatable testing, enable `replay_on_tap: true` and click the instrument.

### HACS still shows an older README

HACS caches repository metadata separately from the downloaded JavaScript. Select **Update information** and reload the HACS page.

### The browser still runs an older JavaScript version

Perform a cache-free reload and verify the console message:

```text
SPLIT-FLAP-DISPLAY-CARD v0.2.7
```

### The card is blank in departure-board mode

Confirm that:

- `entity` exists;
- `departure_attribute` points to an array;
- each array item contains at least `line`, `destination` and either `departure_time` or `planned_time`.

### A destination is truncated

Increase `board_columns.destination`. The complete board width is calculated automatically when `columns` is not specified manually.

## Development

Run the JavaScript syntax checks before committing:

```bash
npm run check
```

Repository structure:

```text
split-flap-display-card.js   Main custom element and initial-animation controller
split-flap-config.js         Configuration validation and normalisation
split-flap-render.js         DOM and physical-cell construction
split-flap-update.js         Data adapters, live animation queue and atomic refresh logic
split-flap-styles.js         Instrument, flap, typography and animation CSS
split-flap-utils.js          Tokens, colours, character sets and shared helpers
examples/                    Fully commented Lovelace examples
docs/images/                 Real screenshots and project branding
```

## Branding

The repository brand icon is a single mechanical split-flap cell containing the letter **S**. It is intentionally simple enough to remain recognisable at small HACS and GitHub sizes.

The icon is stored at:

```text
docs/images/brand-icon.svg
```

## Credits

The behaviour of existing Home Assistant split-flap projects, including `RazManSource/splitflap-card`, was reviewed as reference. This card uses an independent deterministic animation engine rather than random character scrambling.

The built-in S-Bahn badge is an original local rendering inspired by the familiar German green-circle-and-white-S convention; it does not download or bundle a third-party logo image.

## Licence

MIT