export const INITIAL_START_PATTERNS = Object.freeze([
  'simultaneous',
  'wave',
  'scatter',
  'mixed',
]);

function unsignedHash(rowIndex, columnIndex, seed) {
  let value = (
    Math.imul(rowIndex + 1, 0x9e3779b1) ^
    Math.imul(columnIndex + 1, 0x85ebca6b) ^
    Math.imul(seed + 1, 0xc2b2ae35)
  ) >>> 0;

  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b) >>> 0;
  value ^= value >>> 16;
  return value >>> 0;
}

export function deterministicUnit(rowIndex, columnIndex, seed = 0) {
  return unsignedHash(rowIndex, columnIndex, seed) / 0xffffffff;
}

export function initialStartDelay({
  pattern = 'mixed',
  rowIndex = 0,
  columnIndex = 0,
  rowOrdinal = columnIndex,
  ordinal = 0,
  rowStagger = 0,
  cellStagger = 0,
  spread = 0,
  seed = 0,
} = {}) {
  const safePattern = INITIAL_START_PATTERNS.includes(pattern)
    ? pattern
    : 'mixed';
  const safeRowIndex = Math.max(0, Number(rowIndex) || 0);
  const safeColumnIndex = Math.max(0, Number(columnIndex) || 0);
  const safeRowOrdinal = Math.max(0, Number(rowOrdinal) || 0);
  const safeRowStagger = Math.max(0, Number(rowStagger) || 0);
  const safeCellStagger = Math.max(0, Number(cellStagger) || 0);
  const safeSpread = Math.max(0, Number(spread) || 0);
  const rowDelay = safeRowStagger * safeRowIndex;

  if (safePattern === 'simultaneous') return 0;

  // Wave timing follows populated cells, not absolute physical columns. Empty
  // field separators therefore do not create long visible holes in the front.
  const compactCellDelay = safeCellStagger * safeRowOrdinal;
  if (safePattern === 'wave') return rowDelay + compactCellDelay;

  const randomDelay = Math.round(
    safeSpread * deterministicUnit(safeRowIndex, safeColumnIndex, seed)
  );
  if (safePattern === 'scatter') return randomDelay;

  // Mixed is a continuous wave with restrained jitter. Jitter is always smaller
  // than one cell interval, so the visual front stays ordered and gap-free.
  const jitterLimit = Math.min(
    safeSpread,
    safeCellStagger > 0 ? Math.max(1, Math.floor(safeCellStagger * 0.65)) : 0
  );
  const jitter = Math.round(
    jitterLimit * deterministicUnit(safeRowIndex, safeColumnIndex, seed)
  );

  return rowDelay + compactCellDelay + jitter + (Math.max(0, ordinal) % 2);
}
