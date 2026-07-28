export const ANIMATION_PERFORMANCE_MODES = Object.freeze([
  'auto',
  'quality',
  'balanced',
  'fast',
]);

function hardwareThreads() {
  return (
    typeof navigator !== 'undefined' &&
    Number.isFinite(navigator.hardwareConcurrency)
  )
    ? Math.max(1, navigator.hardwareConcurrency)
    : 8;
}

function totalPhysicalCells(config) {
  const rows = config.display_mode === 'departure_board'
    ? Number(config.visible_rows || 0)
    : Number(config.rows?.length || 0);
  return Math.max(0, Number(config.columns || 0) * rows);
}

export function resolveAnimationPerformance(config = {}, jobCount = 0) {
  const requested = String(config.animation_performance || 'auto').toLowerCase();
  if (requested !== 'auto' && ANIMATION_PERFORMANCE_MODES.includes(requested)) {
    return requested;
  }

  const hardware = hardwareThreads();
  const cells = totalPhysicalCells(config);
  const jobs = Math.max(0, Number(jobCount) || 0);

  if (hardware <= 4 || cells >= 260 || jobs >= 140) return 'fast';
  if (hardware <= 8 || cells >= 160 || jobs >= 80) return 'balanced';
  return 'quality';
}

export function animationPerformanceProfile(config = {}, jobCount = 0) {
  const mode = resolveAnimationPerformance(config, jobCount);

  if (mode === 'fast') {
    return Object.freeze({
      mode,
      parallelCap: 8,
      maxWheelSteps: 2,
      minimumDuration: 48,
      animateImpact: false,
      simplifyEffects: true,
    });
  }

  if (mode === 'balanced') {
    return Object.freeze({
      mode,
      parallelCap: 14,
      maxWheelSteps: 3,
      minimumDuration: 64,
      animateImpact: false,
      simplifyEffects: true,
    });
  }

  return Object.freeze({
    mode: 'quality',
    parallelCap: 28,
    maxWheelSteps: 60,
    minimumDuration: 84,
    animateImpact: true,
    simplifyEffects: false,
  });
}
