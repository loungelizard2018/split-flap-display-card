const CHARACTER_GROUPS = Object.freeze([
  Object.freeze([...'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ']),
  Object.freeze([...'abcdefghijklmnopqrstuvwxyzäöü']),
  Object.freeze([...'0123456789']),
  Object.freeze(['.', ',', ':', ';', '-', '+', '/', '\\', '(', ')', '%', '°', '=', '?', '!', '_', '&', '#', '@']),
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

function groupForCharacter(character, fallbackCharset) {
  const group = CHARACTER_GROUPS.find((candidate) => candidate.includes(character));
  if (group) return group;

  const fallback = fallbackCharset.filter((value) => value !== ' ');
  return fallback.length > 0 ? fallback : [character];
}

export function initialWheelSequence({
  charset,
  targetCharacter,
  mode = 'short',
  minSteps = 3,
  maxSteps = 6,
  rowIndex = 0,
  columnIndex = 0,
  seed = 0,
} = {}) {
  const target = String(targetCharacter || ' ')[0] || ' ';
  const safeCharset = Array.isArray(charset) && charset.length > 0
    ? charset
    : [' ', target];

  if (mode === 'full') {
    const targetIndex = safeCharset.includes(target)
      ? safeCharset.indexOf(target)
      : safeCharset.indexOf(' ');
    const sequence = [];
    let index = safeCharset.indexOf(' ');
    if (index < 0) index = 0;

    while (index !== targetIndex) {
      index = (index + 1) % safeCharset.length;
      sequence.push(safeCharset[index]);
      if (sequence.length > safeCharset.length) break;
    }
    return sequence;
  }

  if (target === ' ') return [];

  const minimum = Math.max(1, Math.trunc(Number(minSteps) || 3));
  const maximum = Math.max(minimum, Math.trunc(Number(maxSteps) || 6));
  const stepSpan = maximum - minimum + 1;
  const steps = minimum + (unsignedHash(rowIndex, columnIndex, seed) % stepSpan);
  const group = groupForCharacter(target, safeCharset);
  const targetIndex = Math.max(0, group.indexOf(target));
  const sequence = [];

  for (let offset = steps; offset >= 1; offset -= 1) {
    const index = (targetIndex - offset + group.length) % group.length;
    sequence.push(group[index]);
  }
  sequence.push(target);
  return sequence;
}

export function createConcurrencyGate(limitValue = 24) {
  const limit = Math.max(1, Math.trunc(Number(limitValue) || 24));
  let active = 0;
  const waiters = [];

  const acquire = () => new Promise((resolve) => {
    if (active < limit) {
      active += 1;
      resolve();
      return;
    }
    waiters.push(resolve);
  });

  const release = () => {
    active = Math.max(0, active - 1);
    const next = waiters.shift();
    if (next) {
      active += 1;
      next();
    }
  };

  return { acquire, release };
}
