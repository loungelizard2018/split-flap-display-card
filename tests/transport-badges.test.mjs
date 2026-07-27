import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTransportBadgeStyles,
  renderBuiltInTransportBadge,
} from '../split-flap-transport-badges.js';

function container() {
  return {
    innerHTML: '',
    style: {
      removeProperty() {},
    },
  };
}

test('renders the German S-Bahn badge', () => {
  const target = container();
  assert.equal(renderBuiltInTransportBadge(target, 'splitflap:sbahn'), true);
  assert.match(target.innerHTML, /transport-badge-sbahn/);
  assert.match(target.innerHTML, />\s*S\s*</);
});

test('renders ICE and IC wordmarks with red stripe markup', () => {
  for (const value of ['splitflap:ice:ICE', 'splitflap:ic:IC']) {
    const target = container();
    assert.equal(renderBuiltInTransportBadge(target, value), true);
    assert.match(target.innerHTML, /transport-badge-redline/);
  }
});

test('renders regional labels and sanitises unexpected characters', () => {
  const target = container();
  assert.equal(renderBuiltInTransportBadge(target, 'splitflap:regional:RB-48'), true);
  assert.match(target.innerHTML, /transport-badge-regional/);
  assert.match(target.innerHTML, />\s*RB4\s*</);
  assert.doesNotMatch(target.innerHTML, /RB-/);
});

test('renders the blue German U-Bahn badge', () => {
  const target = container();
  assert.equal(renderBuiltInTransportBadge(target, 'splitflap:ubahn'), true);
  assert.match(target.innerHTML, /transport-badge-ubahn/);
  assert.match(target.innerHTML, />\s*U\s*</);
});

test('does not claim unrelated Material Design icons', () => {
  const target = container();
  assert.equal(renderBuiltInTransportBadge(target, 'mdi:train'), false);
  assert.equal(target.innerHTML, '');
});

test('badge stylesheet contains all built-in German badge classes', () => {
  const css = buildTransportBadgeStyles(50);
  for (const className of [
    'transport-badge-sbahn',
    'transport-badge-ubahn',
    'transport-badge-regional',
    'transport-badge-ice',
    'transport-badge-ic',
  ]) {
    assert.match(css, new RegExp(className));
  }
});
