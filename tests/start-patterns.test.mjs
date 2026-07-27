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
        rowOrdinal: column,
        rowStagger: 150,
        cellStagger: 12,
        spread: 500,
        seed: 4,
      }), 0);
    }
  }
});

test('wave follows populated-cell order instead of physical column gaps', () => {
  assert.equal(initialStartDelay({
    pattern: 'wave', rowIndex: 0, columnIndex: 0, rowOrdinal: 0,
    rowStagger: 100, cellStagger: 10,
  }), 0);
  assert.equal(initialStartDelay({
    pattern: 'wave', rowIndex: 0, columnIndex: 30, rowOrdinal: 3,
    rowStagger: 100, cellStagger: 10,
  }), 30);
  assert.equal(initialStartDelay({
    pattern: 'wave', rowIndex: 2, columnIndex: 30, rowOrdinal: 3,
    rowStagger: 100, cellStagger: 10,
  }), 230);
});

test('mixed remains ordered and gap-free even with a very large spread', () => {
  const delays = Array.from({ length: 24 }, (_, rowOrdinal) =>
    initialStartDelay({
      pattern: 'mixed',
      rowIndex: 1,
      columnIndex: rowOrdinal * 3,
      rowOrdinal,
      ordinal: rowOrdinal,
      rowStagger: 55,
      cellStagger: 6,
      spread: 520,
      seed: 7,
    })
  );

  for (let index = 1; index < delays.length; index += 1) {
    assert.ok(delays[index] > delays[index - 1]);
    assert.ok(delays[index] - delays[index - 1] <= 11);
  }
  assert.ok(Math.min(...delays) >= 55);
  assert.ok(Math.max(...delays) < 210);
});

test('mixed still varies slightly between cells and replay seeds', () => {
  const first = Array.from({ length: 16 }, (_, rowOrdinal) =>
    initialStartDelay({
      pattern: 'mixed',
      rowIndex: 0,
      columnIndex: rowOrdinal,
      rowOrdinal,
      ordinal: rowOrdinal,
      cellStagger: 8,
      spread: 40,
      seed: 9,
    })
  );
  const next = Array.from({ length: 16 }, (_, rowOrdinal) =>
    initialStartDelay({
      pattern: 'mixed',
      rowIndex: 0,
      columnIndex: rowOrdinal,
      rowOrdinal,
      ordinal: rowOrdinal,
      cellStagger: 8,
      spread: 40,
      seed: 10,
    })
  );

  assert.notDeepEqual(first, next);
  assert.ok(new Set(first.map((delay, index) => delay - index * 8)).size > 1);
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
