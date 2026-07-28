import test from 'node:test';
import assert from 'node:assert/strict';
import { effectiveParallelLimit, wheelStepBounds, performanceAnimationMethods } from '../split-flap-performance.js';

test('large boards cap parallel compositor work', () => {
  const limit = effectiveParallelLimit({ initial_max_parallel_cells: 40 }, 300);
  assert.ok(limit >= 8 && limit <= 12);
});

test('large boards retain motion with fewer intermediate steps', () => {
  assert.deepEqual(
    wheelStepBounds({
      initial_wheel_steps_min: 3,
      initial_wheel_steps_max: 6,
      animation_performance: 'quality',
    }, 300),
    { minSteps: 2, maxSteps: 4 }
  );
});

test('replay requests the non-destructive path', () => {
  const calls = [];
  const context = {
    _config: { replay_on_tap: true },
    _rendered: true,
    _hass: {},
    _initialAnimationPending: false,
    _liveUpdateRunning: false,
    _scheduleInitialBuild(delay, options) { calls.push({ delay, options }); },
  };
  performanceAnimationMethods._replayInitialAnimation.call(context);
  assert.deepEqual(calls, [{ delay: 0, options: { replay: true } }]);
});

test('replay scheduling never primes the board with blanks', () => {
  let primed = 0;
  let scheduledDelay = null;
  const oldWindow = globalThis.window;
  globalThis.window = {
    setTimeout(_callback, delay) { scheduledDelay = delay; return 7; },
    clearTimeout() {},
  };
  try {
    const context = {
      _rendered: true,
      _hass: {},
      _config: { initial_animation_delay: 1000 },
      _initialBuildRunId: 0,
      _initialAnimationTimer: null,
      _cancelInitialAnimationTimer() { this._initialBuildRunId += 1; },
      _primeBoardWithFillCharacter() { primed += 1; },
    };
    performanceAnimationMethods._scheduleInitialBuild.call(context, 1000, { replay: true });
    assert.equal(primed, 0);
    assert.equal(scheduledDelay, 80);
  } finally {
    globalThis.window = oldWindow;
  }
});
