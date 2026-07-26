# Split Flap Display Card

A photorealistic airport-style split-flap instrument for Home Assistant. It uses the same black instrument language and cross-head screw treatment as the matching Analog Gauge Card and Mechanical Counter Card.

## Current scope: v0.1.0

- One or more rows with a fixed number of physical flap cells
- Multiple independent segments in each row
- Text, spacers, entity states, attributes, friendly names, date/time values and MDI icons
- Deterministic forward movement through a physical character wheel
- Only changed cells move
- Sequential operation by default (`max_parallel_cells: 1`)
- Real two-stage 3D flap movement instead of random scrambling
- Responsive proportional fitting for desktop, tablet and mobile layouts
- No external JavaScript or font dependencies

## Installation through HACS

1. Open **HACS → Dashboard**.
2. Open **Custom repositories**.
3. Add `https://github.com/loungelizard2018/split-flap-display-card` as category **Dashboard**.
4. Install **Split Flap Display Card**.
5. Reload the Home Assistant frontend.

HACS registers:

```text
/hacsfiles/split-flap-display-card/split-flap-display-card.js
```

## Minimal example

```yaml
type: custom:split-flap-display-card
title: HOME STATUS
columns: 24
rows:
  - segments:
      - type: text
        value: "SYSTEM READY"
        width: 20
      - type: icon
        icon: mdi:home-assistant
        width: 1
```

## Segment composition

```yaml
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
        overflow: clip
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

## Mechanical animation

Text cells move forward through the configured character wheel. A change from `A` to `D` therefore shows `A → B → C → D`. A change from or to an MDI icon uses one complete physical flap because a real mechanism could not contain the complete MDI library on one wheel.

Use strict sequential switching:

```yaml
max_parallel_cells: 1
cell_stagger: 90
```

Allow a small number of overlapping cells:

```yaml
max_parallel_cells: 3
cell_stagger: 80
```

## Main options

| Option | Default | Purpose |
|---|---:|---|
| `columns` | `28` | Physical cells in every row |
| `character_set` | `airport_de` | Ordered character wheel |
| `max_parallel_cells` | `1` | Maximum cells moving at once |
| `cell_stagger` | `90` | Delay between cell starts in milliseconds |
| `step_duration` | `72` | Duration of one character step |
| `flip_duration` | `136` | Direct icon-to-icon or icon/text flap duration |
| `cell_width` / `cell_height` | `34` / `50` | Natural physical cell size |
| `fit_to_card` | `true` | Proportionally shrink to the dashboard column |
| `allow_upscale` | `false` | Permit enlargement in wide columns |
| `screws` | `true` | Show gauge-style cross-head screws |

## Development check

```bash
npm run check
```

## Credits

The behaviour of existing Home Assistant split-flap projects, including `RazManSource/splitflap-card`, was reviewed as reference. This card uses an independent deterministic animation engine rather than random character scrambling.

## Licence

MIT
