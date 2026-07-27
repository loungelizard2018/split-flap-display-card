import test from 'node:test';
import assert from 'node:assert/strict';

import {
  INITIAL_START_PATTERNS,
  deterministicUnit,
  initialStartDelay,
} from '../split-flap-start-patterns.js';

test('supports the documented startup patterns', () => {
  assert.deepEqual(
    INITIAL_START_PATTERNS,
    ['simultaneous', 'wave', 'scatter', 'mixed']
  );
});

test('simultaneous starts every cell at zero', () => {
  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 30; column += 1) {
      assert.equal(initialStartDelay({
        pattern: 'simultaneous',
        rowIndex: row,
        columnIndex: column,
        rowStagger: 150,
        cellStagger: 12,
        spread: 500,
        seed: 4,
      }), 0);
    }
  }
});

test('wave increases predictably from left to right and top to bottom', () => {
  assert.equal(initialStartDelay({
    pattern: 'wave', rowIndex: 0, columnIndex: 0,
    rowStagger: 100, cellStagger: 10,
  }), 0);
  assert.equal(initialStartDelay({
    pattern: 'wave', rowIndex: 0, columnIndex: 3,
    rowStagger: 100, cellStagger: 10,
  }), 30);
  assert.equal(initialStartDelay({
    pattern: 'wave', rowIndex: 2, columnIndex: 3,
    rowStagger: 100, cellStagger: 10,
  }), 230);
});

test('mixed produces varied but bounded offsets within each row', () => {
  const delays = Array.from({ length: 24 }, (_, columnIndex) =>
    initialStartDelay({
      pattern: 'mixed',
      rowIndex: 1,
      columnIndex,
      ordinal: columnIndex,
      rowStagger: 120,
      spread: 420,
      seed: 7,
    })
  );

  assert.ok(new Set(delays).size > 12);
  assert.ok(Math.min(...delays) >= 120);
  assert.ok(Math.max(...delays) <= 542);
});

test('scatter is deterministic for one run and changes with the seed', () => {
  const first = Array.from({ length: 20 }, (_, columnIndex) =>
    initialStartDelay({
      pattern: 'scatter',
      rowIndex: 2,
      columnIndex,
      spread: 600,
      seed: 11,
    })
  );
  const repeated = Array.from({ length: 20 }, (_, columnIndex) =>
    initialStartDelay({
      pattern: 'scatter',
      rowIndex: 2,
      columnIndex,
      spread: 600,
      seed: 11,
    })
  );
  const nextRun = Array.from({ length: 20 }, (_, columnIndex) =>
    initialStartDelay({
      pattern: 'scatter',
      rowIndex: 2,
      columnIndex,
      spread: 600,
      seed: 12,
    })
  );

  assert.deepEqual(first, repeated);
  assert.notDeepEqual(first, nextRun);
});

test('deterministic unit interval stays within zero and one', () => {
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 50; column += 1) {
      const value = deterministicUnit(row, column, 9);
      assert.ok(value >= 0 && value <= 1);
    }
  }
});
