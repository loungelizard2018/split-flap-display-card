# Split Flap Display Card

A photorealistic airport-style split-flap instrument for Home Assistant. The black textured housing and cross-head screws match the companion Analog Gauge Card and Mechanical Counter Card.

## Version 0.2.0

- Free segment composition for text, entities, attributes, date/time values and MDI icons
- Direct OpenPublicTransport departure-board mode
- Automatic bus, S-Bahn, train, regional train, subway, tram and ferry icon selection
- Delay and cancellation colours
- Sequential or near-simultaneous cell switching
- Deterministic forward movement through a physical character wheel
- Improved glyph placement so centre strokes in `E`, `F` and `H` remain visible
- Responsive proportional fitting for desktop, tablet and mobile dashboards
- No external JavaScript or font dependencies

## HACS installation

1. Open **HACS → Dashboard**.
2. Open **Custom repositories**.
3. Add `https://github.com/loungelizard2018/split-flap-display-card` as category **Dashboard**.
4. Install or redownload **Split Flap Display Card**.
5. Reload the Home Assistant frontend without browser cache.

HACS resource:

```text
/hacsfiles/split-flap-display-card/split-flap-display-card.js
```

## OpenPublicTransport departure board

The card reads the `departures` attribute directly. No template sensor is required.

```yaml
type: custom:split-flap-display-card
display_mode: departure_board
entity: sensor.swisttal_odendorf_bf_nahreisezug_swisttal_odendorf_bf
departure_attribute: departures
station_name_attribute: station_name

title: ABFAHRTSTAFEL
visible_rows: 8
show_column_headers: true
show_header_clock: true

start_mode: simultaneous
cell_stagger: 4
step_duration: 58
flip_duration: 118

fit_to_card: true
allow_upscale: false
screws: true

board_columns:
  mode: 2
  time: 5
  line: 5
  destination: 20
  platform: 3
  delay: 4
  gap: 1

departure_colors:
  normal: "#f2c400"
  delayed: "#ff5263"
  cancelled: "#ff3347"
  header: "#aaa89e"

transport_icon_map:
  bus: mdi:bus
  sbahn: mdi:alpha-s-circle
  train: mdi:train
  regional: mdi:train
  subway: mdi:subway-variant
  tram: mdi:tram
  ferry: mdi:ferry
  unknown: mdi:transit-connection-variant
```

The card uses the supplied OpenPublicTransport fields:

- `departure_time`
- `planned_time`
- `line`
- `destination`
- `platform`
- `delay`
- `transportation_type`
- optional `cancelled` or `is_cancelled`

Lines beginning with `S` are treated as S-Bahn even when the integration reports the generic transportation type `train`. `U`, `RE`, `RB`, `ICE`, `IC` and `EC` line prefixes are also classified automatically.

## Animation modes

Strictly one changed cell at a time:

```yaml
start_mode: sequential
max_parallel_cells: 1
cell_stagger: 60
```

All changed cells together:

```yaml
start_mode: simultaneous
cell_stagger: 0
```

Fast mechanical wave:

```yaml
start_mode: simultaneous
cell_stagger: 4
```

Every text cell still advances through its ordered physical character wheel. `A` to `D` therefore shows `A → B → C → D`. MDI icons use one complete direct flap because a physical wheel cannot plausibly contain the complete MDI library.

## Free segment mode

```yaml
type: custom:split-flap-display-card
display_mode: segments
title: HOME STATUS
columns: 30
start_mode: simultaneous
cell_stagger: 6
rows:
  - segments:
      - type: datetime
        entity: sensor.date_time_iso
        format: "HH:mm"
        width: 5
      - type: spacer
        width: 1
      - type: friendly_name
        entity: sensor.bigpool_cpu_temperature
        width: 14
      - type: spacer
        width: 1
      - type: entity
        entity: sensor.bigpool_cpu_temperature
        decimals: 0
        suffix: "°"
        width: 5
        align: right
      - type: icon
        icon: mdi:cpu-64-bit
        width: 1
```

Supported segment types:

- `text`
- `spacer`
- `entity`
- `attribute`
- `friendly_name`
- `datetime`
- `icon`
- `entity_icon`

Segments also accept `width`, `align`, `pad`, `prefix`, `suffix`, `uppercase`, `decimals`, `decimal_separator` and `color`.

## Typography controls

```yaml
glyph_weight: 500
glyph_scale: 0.61
glyph_offset_y: -1.5
```

The default vertical offset moves horizontal centre strokes slightly away from the physical flap seam, improving `E`, `F` and `H` readability.

## Development check

```bash
npm run check
```

## Credits

The behaviour of existing Home Assistant split-flap projects, including `RazManSource/splitflap-card`, was reviewed as reference. This card uses an independent deterministic animation engine rather than random character scrambling.

## Licence

MIT
