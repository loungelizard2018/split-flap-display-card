export const CHARSETS = Object.freeze({
  airport_de: Object.freeze([
    ' ', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'Ä', 'Ö', 'Ü',
    ...'0123456789', '.', ',', ':', ';', '-', '+', '/', '\\',
    '(', ')', '%', '°', '=', '?', '!', '_', '&', '#', '@'
  ]),
  alphanumeric: Object.freeze([
    ' ', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', ...'0123456789',
    '.', ',', ':', ';', '-', '+', '/', '(', ')', '%', '?', '!'
  ]),
  numeric: Object.freeze([' ', ...'0123456789', '.', ',', ':', '-', '+', '%', '°'])
});

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function boundedNumber(value, min, max, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? clamp(parsed, min, max) : fallback;
}

export function boundedInteger(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? clamp(parsed, min, max) : fallback;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function safeCssColor(value, fallback = '') {
  const text = String(value ?? '').trim();
  if (!text) return fallback;
  return /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,24}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\)|var\(--[-\w]+\))$/.test(text)
    ? text
    : fallback;
}

export function charToken(value = ' ', color = '') {
  const text = String(value || ' ');
  return { type: 'char', value: [...text][0] || ' ', color: safeCssColor(color) };
}

export function iconToken(value = 'mdi:help-circle-outline', color = '') {
  return {
    type: 'icon',
    value: String(value || 'mdi:help-circle-outline'),
    color: safeCssColor(color),
  };
}

export function normaliseToken(token) {
  if (!token || typeof token !== 'object') return charToken(' ');
  return token.type === 'icon'
    ? iconToken(token.value, token.color)
    : charToken(token.value, token.color);
}

export function tokensEqual(left, right) {
  return Boolean(
    left && right &&
    left.type === right.type &&
    left.value === right.value &&
    (left.color || '') === (right.color || '')
  );
}

export function tokenSignature(rows) {
  return rows
    .map((row) => row.map((token) => `${token.type}:${token.value}:${token.color || ''}`).join('\u001f'))
    .join('\u001e');
}

export function textTokens(value, color = '') {
  return [...String(value ?? '')].map((character) => charToken(character, color));
}

export function sleep(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
