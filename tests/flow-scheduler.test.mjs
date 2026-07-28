import test from 'node:test';
import assert from 'node:assert/strict';

import {
  effectiveFlowParallelLimit,
  runFlowingWheel,
} from '../split-flap-flow-scheduler.js';

function token(value) {
  return { type: 'char', value, color: '' };
}

function job(name, delay, rowOrdinal) {
  return {
    name,
    rowIndex: 0,
    columnIndex: rowOrdinal,
    rowOrdinal,
    ordinal: rowOrdinal,
    delay,
    duration: 1,
    sequence: [token(`${name}1`), token(`${name}2`) ],
    state: {
      current: token(' '),
      runId: 1,
      busy: true,
      pending: token(`${name}2`),
    },
    refs: {},
    runId: 1,
  };
}

test('flow parallelism remains useful on large boards without flooding the compositor', () => {
  const limit = effectiveFlowParallelLimit({
    initial_max_parallel_cells: 40,
    animation_performance: 'quality',
  }, 300);
  assert.ok(limit >= 8 && limit <= 20);
});

test('once a cell starts, it completes before its slot is reused', async () => {
  const events = [];
  const jobs = [job('A', 0, 0), job('B', 0, 1)];
  const card = {
    _config: { initial_max_parallel_cells: 1 },
    _initialBuildRunId: 3,
    _animationGeneration: 7,
    _rendered: true,
    isConnected: true,
    async _flipCell(_refs, _from, to) {
      events.push(to.value);
      await new Promise((resolve) => setTimeout(resolve, 1));
      return true;
    },
  };

  const completed = await runFlowingWheel(card, jobs, 7, 3);

  assert.equal(completed, true);
  assert.deepEqual(events, ['A1', 'A2', 'B1', 'B2']);
});

test('scheduled cells settle on their final token', async () => {
  const jobs = [job('A', 0, 0), job('B', 2, 1), job('C', 4, 2)];
  const card = {
    _config: { initial_max_parallel_cells: 3 },
    _initialBuildRunId: 2,
    _animationGeneration: 4,
    _rendered: true,
    isConnected: true,
    async _flipCell(_refs, _from, _to) {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return true;
    },
  };

  const completed = await runFlowingWheel(card, jobs, 4, 2);

  assert.equal(completed, true);
  assert.deepEqual(jobs.map((item) => item.state.current.value), ['A2', 'B2', 'C2']);
  assert.ok(jobs.every((item) => item.state.busy === false));
});
