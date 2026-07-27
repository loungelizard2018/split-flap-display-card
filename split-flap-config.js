import { boundedInteger, boundedNumber, safeCssColor } from './split-flap-utils.js?v=0.2.18';

const ALLOWED_SEGMENTS = new Set([
  'text', 'spacer', 'entity', 'attribute', 'friendly_name',
  'datetime', 'icon', 'entity_icon'
]);

const DEFAULT_BOARD_COLUMNS = Object.freeze({
  mode: 2,
  time: 5,
  line: 5,
  destination: 20,
  platform: 3,
  delay: 4,
  gap: 1,
});

const DEFAULT_TRANSPORT_ICONS = Object.freeze({
  bus: 'mdi:bus',
  sbahn: 'splitflap:sbahn',
  ice: 'splitflap:ice',
  ic: 'splitflap:ic',
  train: 'mdi:train',
  regional: 'splitflap:regional',
  subway: 'splitflap:ubahn',
  tram: 'mdi:tram',
  ferry: 'mdi:ferry',
  unknown: 'mdi:transit-connection-variant',
});

export const configMethods = {
  _normaliseConfig(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('split-flap-display-card: configuration is required.');
    }

    const displayMode = String(config.display_mode || 'segments').toLowerCase();
    if (!['segments', 'departure_board'].includes(displayMode)) {
      throw new Error("split-flap-display-card: 'display_mode' must be 'segments' or 'departure_board'.");
    }

    if (displayMode === 'segments' && (!Array.isArray(config.rows) || config.rows.length === 0)) {
      throw new Error("split-flap-display-card: 'rows' must be a non-empty list in segments mode.");
    }

    if (displayMode === 'departure_board' && !config.entity) {
      throw new Error("split-flap-display-card: 'entity' is required in departure_board mode.");
    }

    const boardColumns = {
      ...DEFAULT_BOARD_COLUMNS,
      ...(config.board_columns || {}),
    };
    Object.keys(DEFAULT_BOARD_COLUMNS).forEach((key) => {
      boardColumns[key] = boundedInteger(
        boardColumns[key],
        key === 'gap' ? 0 : 1,
        key === 'destination' ? 50 : 12,
        DEFAULT_BOARD_COLUMNS[key]
      );
    });

    const calculatedColumns = this._calculateDepartureColumns(boardColumns);
    const defaultLiveUpdateStyle = displayMode === 'departure_board' ? 'direct' : 'wheel';
    const inheritedInitialRowStagger = config.initial_row_stagger ??
      config.cell_stagger ??
      120;

    const normalised = {
      title: displayMode === 'departure_board' ? 'DEPARTURES' : '',
      subtitle: '',
      display_mode: displayMode,
      entity: config.entity,
      departure_attribute: 'departures',
      station_name_attribute: 'station_name',
      visible_rows: 8,
      show_column_headers: true,
      show_header_clock: true,
      columns: displayMode === 'departure_board' ? calculatedColumns : 28,
      board_columns: boardColumns,
      character_set: 'airport_de',
      uppercase: true,
      frame: 'gauge_black',
      screws: true,
      transparent_card: true,
      fit_to_card: true,
      allow_upscale: false,
      max_fit_scale: 1,
      cell_width: 34,
      cell_height: 50,
      cell_gap: 3,
      row_gap: 8,

      start_mode: 'sequential',
      live_update_style: defaultLiveUpdateStyle,
      live_row_stagger: 0,
      flip_duration: 136,
      step_duration: 72,
      cell_stagger: displayMode === 'departure_board' ? 4 : 18,
      max_parallel_cells: 1,

      animate_on_first_load: true,
      initial_animation_delay: 450,
      initial_fill_char: ' ',
      initial_animation_style: 'direct',
      initial_flip_duration: 220,
      initial_row_stagger: inheritedInitialRowStagger,
      replay_on_tap: false,

      unavailable_text: 'UNAVAILABLE',
      unknown_text: 'UNKNOWN',
      text_color: '#f2f1e9',
      glyph_weight: 500,
      glyph_scale: 0.61,
      glyph_offset_y: -1.5,
      transport_icon_map: { ...DEFAULT_TRANSPORT_ICONS },
      departure_colors: {
        normal: '#f2c400',
        delayed: '#ff5263',
        cancelled: '#ff3347',
        header: '#aaa89e',
      },
      rows: [],
      ...config,
      board_columns: boardColumns,
      initial_row_stagger: inheritedInitialRowStagger,
      transport_icon_map: {
        ...DEFAULT_TRANSPORT_ICONS,
        ...(config.transport_icon_map || {}),
      },
      departure_colors: {
        normal: '#f2c400',
        delayed: '#ff5263',
        cancelled: '#ff3347',
        header: '#aaa89e',
        ...(config.departure_colors || {}),
      },
    };

    if (config.columns == null && displayMode === 'departure_board') {
      normalised.columns = calculatedColumns;
    }

    normalised.columns = boundedInteger(normalised.columns, 4, 100, calculatedColumns);
    normalised.visible_rows = boundedInteger(normalised.visible_rows, 1, 20, 8);
    normalised.cell_width = boundedNumber(normalised.cell_width, 18, 90, 34);
    normalised.cell_height = boundedNumber(normalised.cell_height, 28, 130, 50);
    normalised.cell_gap = boundedNumber(normalised.cell_gap, 0, 16, 3);
    normalised.row_gap = boundedNumber(normalised.row_gap, 0, 30, 8);
    normalised.flip_duration = boundedInteger(normalised.flip_duration, 70, 1200, 136);
    normalised.step_duration = boundedInteger(normalised.step_duration, 35, 800, 72);
    normalised.cell_stagger = boundedInteger(normalised.cell_stagger, 0, 1500, 18);
    normalised.live_row_stagger = boundedInteger(normalised.live_row_stagger, 0, 3000, 0);
    normalised.max_parallel_cells = boundedInteger(normalised.max_parallel_cells, 1, 40, 1);
    normalised.max_fit_scale = boundedNumber(normalised.max_fit_scale, 1, 3, 1);
    normalised.glyph_weight = boundedInteger(normalised.glyph_weight, 300, 800, 500);
    normalised.glyph_scale = boundedNumber(normalised.glyph_scale, 0.45, 0.82, 0.61);
    normalised.glyph_offset_y = boundedNumber(normalised.glyph_offset_y, -8, 8, -1.5);
    normalised.initial_animation_delay = boundedInteger(
      normalised.initial_animation_delay,
      0,
      10000,
      450
    );
    normalised.initial_flip_duration = boundedInteger(
      normalised.initial_flip_duration,
      70,
      1200,
      220
    );
    normalised.initial_row_stagger = boundedInteger(
      normalised.initial_row_stagger,
      0,
      3000,
      120
    );

    normalised.animate_on_first_load = normalised.animate_on_first_load !== false;
    normalised.replay_on_tap = normalised.replay_on_tap === true;
    normalised.initial_fill_char = [...String(normalised.initial_fill_char ?? ' ')][0] || ' ';

    normalised.initial_animation_style = String(
      normalised.initial_animation_style || 'direct'
    ).toLowerCase();
    if (!['direct', 'wheel'].includes(normalised.initial_animation_style)) {
      throw new Error("split-flap-display-card: 'initial_animation_style' must be 'direct' or 'wheel'.");
    }

    normalised.live_update_style = String(
      normalised.live_update_style || defaultLiveUpdateStyle
    ).toLowerCase();
    if (!['direct', 'wheel'].includes(normalised.live_update_style)) {
      throw new Error("split-flap-display-card: 'live_update_style' must be 'direct' or 'wheel'.");
    }

    normalised.start_mode = String(normalised.start_mode || 'sequential').toLowerCase();
    if (!['sequential', 'simultaneous'].includes(normalised.start_mode)) {
      throw new Error("split-flap-display-card: 'start_mode' must be 'sequential' or 'simultaneous'.");
    }

    normalised.text_color = safeCssColor(normalised.text_color, '#f2f1e9');
    Object.keys(normalised.departure_colors).forEach((key) => {
      normalised.departure_colors[key] = safeCssColor(
        normalised.departure_colors[key],
        key === 'normal' ? '#f2c400' : '#ff5263'
      );
    });

    normalised.rows = displayMode === 'segments'
      ? config.rows.map((row, rowIndex) => this._normaliseRow(row, rowIndex))
      : Array.from({ length: normalised.visible_rows }, () => ({ segments: [] }));

    return normalised;
  },

  _calculateDepartureColumns(columns) {
    return columns.mode + columns.time + columns.line + columns.destination +
      columns.platform + columns.delay + (columns.gap * 5);
  },

  _departureLayout() {
    const columns = this._config.board_columns;
    const fields = [];
    let start = 1;
    const add = (key, label, width) => {
      fields.push({ key, label, start, width });
      start += width;
    };
    const gap = () => { start += columns.gap; };

    add('mode', '', columns.mode); gap();
    add('time', 'TIME', columns.time); gap();
    add('line', 'LINE', columns.line); gap();
    add('destination', 'DESTINATION', columns.destination); gap();
    add('platform', 'PLATFORM', columns.platform); gap();
    add('delay', 'DELAY', columns.delay);
    return fields;
  },

  _normaliseRow(row, rowIndex) {
    if (!row || !Array.isArray(row.segments)) {
      throw new Error(`split-flap-display-card: row ${rowIndex + 1} requires a 'segments' list.`);
    }

    return {
      align: 'left',
      ...row,
      segments: row.segments.map((segment, segmentIndex) =>
        this._normaliseSegment(segment, rowIndex, segmentIndex)
      ),
    };
  },

  _normaliseSegment(segment, rowIndex, segmentIndex) {
    if (!segment || typeof segment !== 'object') {
      throw new Error(`split-flap-display-card: row ${rowIndex + 1}, segment ${segmentIndex + 1} is invalid.`);
    }

    const type = String(segment.type || 'text').toLowerCase();
    if (!ALLOWED_SEGMENTS.has(type)) {
      throw new Error(`split-flap-display-card: unsupported segment type '${type}'.`);
    }

    if (['entity', 'attribute', 'friendly_name', 'datetime', 'entity_icon'].includes(type) && !segment.entity) {
      throw new Error(`split-flap-display-card: segment type '${type}' requires 'entity'.`);
    }

    if (type === 'attribute' && !segment.attribute) {
      throw new Error("split-flap-display-card: segment type 'attribute' requires 'attribute'.");
    }

    const widthDefault = type === 'spacer' || type === 'icon' || type === 'entity_icon' ? 1 : undefined;
    const width = segment.width == null
      ? widthDefault
      : boundedInteger(segment.width, 0, 100, widthDefault || 1);

    return {
      align: 'left',
      pad: ' ',
      overflow: 'clip',
      prefix: '',
      suffix: '',
      uppercase: undefined,
      ...segment,
      type,
      width,
    };
  },
};
