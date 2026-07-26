import { boundedInteger, boundedNumber } from './split-flap-utils.js?v=0.1.0';

const ALLOWED_SEGMENTS = new Set([
  'text', 'spacer', 'entity', 'attribute', 'friendly_name',
  'datetime', 'icon', 'entity_icon'
]);

export const configMethods = {
  _normaliseConfig(config) {
    if (!config || !Array.isArray(config.rows) || config.rows.length === 0) {
      throw new Error("split-flap-display-card: 'rows' must be a non-empty list.");
    }

    const normalised = {
      title: '',
      subtitle: '',
      columns: 28,
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
      row_gap: 10,
      flip_duration: 136,
      step_duration: 72,
      cell_stagger: 90,
      max_parallel_cells: 1,
      unavailable_text: 'UNAVAILABLE',
      unknown_text: 'UNKNOWN',
      ...config,
    };

    normalised.columns = boundedInteger(normalised.columns, 4, 80, 28);
    normalised.cell_width = boundedNumber(normalised.cell_width, 18, 90, 34);
    normalised.cell_height = boundedNumber(normalised.cell_height, 28, 130, 50);
    normalised.cell_gap = boundedNumber(normalised.cell_gap, 0, 16, 3);
    normalised.row_gap = boundedNumber(normalised.row_gap, 0, 30, 10);
    normalised.flip_duration = boundedInteger(normalised.flip_duration, 70, 1200, 136);
    normalised.step_duration = boundedInteger(normalised.step_duration, 35, 800, 72);
    normalised.cell_stagger = boundedInteger(normalised.cell_stagger, 0, 1500, 90);
    normalised.max_parallel_cells = boundedInteger(normalised.max_parallel_cells, 1, 24, 1);
    normalised.max_fit_scale = boundedNumber(normalised.max_fit_scale, 1, 3, 1);

    normalised.rows = normalised.rows.map((row, rowIndex) => this._normaliseRow(row, rowIndex));
    return normalised;
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
      : boundedInteger(segment.width, 0, 80, widthDefault || 1);

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
