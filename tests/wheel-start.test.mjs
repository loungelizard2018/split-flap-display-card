import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createConcurrencyGate,
  initialWheelSequence,
} from '../split-flap-wheel-start.js';

const charset = [
  ' ', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ',
  ...'abcdefghijklmnopqrstuvwxyzäöü',
  ...'0123456789', '.', ',', ':', '-', '+',
];

test('short startup sequence reaches its target with bounded travel', () => {
  const sequence = initialWheelSequence({
    charset,
    targetCharacter: 'n',
    mode: 'short',
    minSteps: 3,
    maxSteps: 6,
    rowIndex: 2,
    columnIndex: 8,
    seed: 4,
  });

  assert.equal(sequence.at(-1), 'n');
  assert.ok(sequence.length >= 4);
  assert.ok(sequence.length <= 7);
  assert.ok(sequence.every((character) => /[a-zäöü]/.test(character)));
});

test('short sequences vary by cell while remaining deterministic', () => {
  const left = initialWheelSequence({
    charset,
    targetCharacter: 'B',
    rowIndex: 0,
    columnIndex: 1,
    seed: 9,
  });
  const right = initialWheelSequence({
    charset,
    targetCharacter: 'B',
    rowIndex: 0,
    columnIndex: 2,
    seed: 9,
  });
  const repeated = initialWheelSequence({
    charset,
    targetCharacter: 'B',
    rowIndex: 0,
    columnIndex: 1,
    seed: 9,
  });

  assert.deepEqual(left, repeated);
  assert.notDeepEqual(left, right);
});

test('full mode retains the complete physical wheel path', () => {
  const sequence = initialWheelSequence({
    charset,
    targetCharacter: 'D',
    mode: 'full',
  });

  assert.deepEqual(sequence.slice(0, 4), ['A', 'B', 'C', 'D']);
});

test('concurrency gate never exceeds its configured limit', async () => {
  const gate = createConcurrencyGate(3);
  let active = 0;
  let maximum = 0;

  await Promise.all(Array.from({ length: 12 }, async () => {
    await gate.acquire();
    active += 1;
    maximum = Math.max(maximum, active);
    await new Promise((resolve) => setTimeout(resolve, 2));
    active -= 1;
    gate.release();
  }));

  assert.equal(maximum, 3);
});
