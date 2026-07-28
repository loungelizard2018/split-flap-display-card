import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ANIMATION_PERFORMANCE_MODES,
  animationPerformanceProfile,
  resolveAnimationPerformance,
} from '../split-flap-performance-profile.js';

test('exposes all supported performance modes', () => {
  assert.deepEqual(
    [...ANIMATION_PERFORMANCE_MODES],
    ['auto', 'quality', 'balanced', 'fast']
  );
});

test('honours explicit fast mode', () => {
  const mode = resolveAnimationPerformance({
    animation_performance: 'fast',
    columns: 20,
    visible_rows: 3,
    display_mode: 'departure_board',
  }, 10);

  assert.equal(mode, 'fast');
});

test('large boards automatically select the fast profile', () => {
  const mode = resolveAnimationPerformance({
    animation_performance: 'auto',
    columns: 54,
    visible_rows: 5,
    display_mode: 'departure_board',
  }, 120);

  assert.equal(mode, 'fast');
});

test('fast mode limits parallelism and wheel travel', () => {
  const profile = animationPerformanceProfile({
    animation_performance: 'fast',
  }, 100);

  assert.equal(profile.parallelCap, 8);
  assert.equal(profile.maxWheelSteps, 2);
  assert.equal(profile.animateImpact, false);
  assert.equal(profile.simplifyEffects, true);
});
