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
  ordinal = 0,
  rowStagger = 0,
  cellStagger = 0,
  spread = 0,
  seed = 0,
} = {}) {
  const safePattern = INITIAL_START_PATTERNS.includes(pattern)
    ? pattern
    : 'mixed';
  const rowDelay = Math.max(0, Number(rowStagger) || 0) * Math.max(0, rowIndex);
  const cellDelay = Math.max(0, Number(cellStagger) || 0) * Math.max(0, columnIndex);
  const randomDelay = Math.round(
    Math.max(0, Number(spread) || 0) *
    deterministicUnit(rowIndex, columnIndex, seed)
  );

  if (safePattern === 'simultaneous') return 0;
  if (safePattern === 'wave') return rowDelay + cellDelay;
  if (safePattern === 'scatter') return randomDelay;

  // mixed: rows retain a loose top-to-bottom order, while cells inside each
  // row start at deterministic irregular offsets. A tiny ordinal component
  // prevents visually identical delays when two hashes round to the same ms.
  return rowDelay + randomDelay + (Math.max(0, ordinal) % 3);
}
