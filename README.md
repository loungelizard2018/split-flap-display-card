# Split Flap Display Card

A photorealistic split-flap instrument for Home Assistant. The black textured housing and cross-head screws match the companion Analog Gauge Card and Mechanical Counter Card.

Unlike scramble-style boards, changed cells advance through an ordered physical character ring. Cells start individually and can run strictly one at a time or with limited overlap.

## Current status

Version `0.1.0` is the first functional implementation. It includes:

- individually animated cells
- ordered forward-only character changes
- direct mechanical flip for MDI icons
- independent text, entity, attribute, friendly-name, icon and spacer segments
- fixed-width padding, alignment and clipping
- responsive scaling to the available Lovelace column
- black aircraft-style housing and four cross-head screws

## HACS installation

1. Open **HACS → Dashboard**.
2. Add `https://github.com/loungelizard2018/split-flap-display-card` as a custom Dashboard repository.
3. Install **Split Flap Display Card**.
4. Reload the Home Assistant frontend.

Resource path:

```text
/hacsfiles/split-flap-display-card/split-flap-display-card.js
```

## Example

```yaml
type: custom:split-flap-display-card
title: ODENDORF SYSTEMS
columns: 28
fit_to_card: true
allow_upscale: false
animation: true
animation_mode: physical
start_order: left_to_right
max_parallel_cells: 1
cell_stagger: 90
flap_duration: 72
rows:
  - segments:
      - type: entity
        entity: sensor.time
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
        width: 5
        align: right
        decimals: 0
      - type: text
        value: "°C"
        width: 2
  - segments:
      - type: icon
        icon: mdi:server
        width: 1
      - type: spacer
        width: 1
      - type: text
        value: "BIGPOOL ONLINE"
        width: 20
```

## Segment types

| Type | Purpose |
|---|---|
| `text` | Fixed text from `value` |
| `entity` | Entity state |
| `attribute` | Entity attribute named by `attribute` |
| `friendly_name` | Entity friendly name |
| `icon` | Static MDI icon |
| `entity_icon` | Icon from an entity's `icon` attribute |
| `spacer` | Blank physical cells |

Common segment options:

```yaml
width: 12
align: left       # left, center, right
pad: " "
overflow: clip    # clip or ellipsis
uppercase: true
prefix: ""
suffix: ""
decimals: 1
```

## Animation controls

```yaml
animation_mode: physical   # physical or direct
start_order: left_to_right # left_to_right, right_to_left, random
max_parallel_cells: 1      # 1 = strictly one changed cell at a time
cell_stagger: 90
flap_duration: 72
start_jitter: 18
speed_jitter: 5
```

Text cells advance only forward through the configured character ring. MDI icons use one direct mechanical flip because a real flap wheel cannot plausibly contain the complete MDI library.

## Credits

The project was informed by the MIT-licensed `RazManSource/splitflap-card`, particularly its changed-cell detection and stagger concept. The rendering, physical character sequencing, independent cell control and instrument styling in this repository are separate implementations.

## Licence

MIT
