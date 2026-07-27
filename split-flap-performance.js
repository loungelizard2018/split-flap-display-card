import {
  CHARSETS,
  charToken,
  normaliseToken,
  sleep,
  tokenSignature,
  tokensEqual,
} from './split-flap-utils.js?v=0.2.25';
import { initialStartDelay } from './split-flap-start-patterns.js?v=0.2.25';
import { initialWheelSequence } from './split-flap-wheel-start.js?v=0.2.25';
import { runFlowingWheel } from './split-flap-flow-scheduler.js?v=0.2.25';

const nextFrame = () => new Promise((resolve) => {
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => resolve());
  } else {
    setTimeout(resolve, 16);
  }
});

export function effectiveParallelLimit(config, jobCount) {
  const requested = Math.max(1, Math.trunc(Number(config.initial_max_parallel_cells) || 12));
  const hardware = typeof navigator !== 'undefined' && Number.isFinite(navigator.hardwareConcurrency)
    ? navigator.hardwareConcurrency
    : 8;
  const adaptiveCap = Math.max(8, Math.min(16, hardware * 2));
  const boardCap = jobCount > 220 ? 12 : jobCount > 120 ? 14 : 16;
  return Math.max(1, Math.min(requested, adaptiveCap, boardCap));
}

export function wheelStepBounds(config, populatedCells) {
  const configuredMin = Math.max(1, Math.trunc(Number(config.initial_wheel_steps_min) || 3));
  const configuredMax = Math.max(configuredMin, Math.trunc(Number(config.initial_wheel_steps_max) || 6));
  if (populatedCells > 220) return { minSteps: Math.min(configuredMin, 2), maxSteps: Math.min(configuredMax, 4) };
  if (populatedCells > 120) return { minSteps: Math.min(configuredMin, 3), maxSteps: Math.min(configuredMax, 5) };
  return { minSteps: configuredMin, maxSteps: configuredMax };
}

function animationFinished(animation) {
  return animation.finished.catch(() => false);
}

async function runRoundRobinWheel(card, jobs, generation, buildRunId) {
  if (jobs.length === 0) return true;

  const concurrency = effectiveParallelLimit(card._config, jobs.length);
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const pending = jobs.slice().sort((left, right) => left.delay - right.delay || left.ordinal - right.ordinal);
  const ready = [];
  const running = new Set();
  let failed = false;
  let completed = 0;

  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const valid = () => (
    !failed &&
    buildRunId === card._initialBuildRunId &&
    generation === card._animationGeneration &&
    card._rendered &&
    card.isConnected
  );

  const releaseReadyJobs = () => {
    const elapsed = now() - startTime;
    while (pending.length > 0 && pending[0].delay <= elapsed) ready.push(pending.shift());
  };

  const finishJob = (job, success) => {
    if (job.state.runId === job.runId) {
      job.state.busy = false;
      job.state.pending = null;
    }
    if (!success) failed = true;
    else completed += 1;
  };

  const runOneStep = async (job) => {
    if (!valid() || job.state.runId !== job.runId) return { job, success: false, done: true };

    const next = job.sequence[job.index];
    const committed = await card._flipCell(
      job.refs,
      job.state.current,
      next,
      job.duration
    );

    if (!committed || !valid() || job.state.runId !== job.runId) {
      return { job, success: false, done: true };
    }

    job.state.current = next;
    job.index += 1;
    return { job, success: true, done: job.index >= job.sequence.length };
  };

  while (valid() && completed < jobs.length) {
    releaseReadyJobs();

    while (ready.length > 0 && running.size < concurrency && valid()) {
      const job = ready.shift();
      const task = runOneStep(job).then((result) => {
        running.delete(task);
        if (!result.success) {
          finishJob(result.job, false);
          return;
        }
        if (result.done) finishJob(result.job, true);
        else ready.push(result.job);
      });
      running.add(task);
    }

    if (!valid()) break;

    if (running.size > 0) {
      await Promise.race(running);
      await nextFrame();
      continue;
    }

    if (pending.length > 0) {
      const wait = Math.max(1, Math.min(24, pending[0].delay - (now() - startTime)));
      await sleep(wait);
      continue;
    }

    if (ready.length === 0) break;
  }

  await Promise.allSettled([...running]);

  if (!valid() || failed || completed !== jobs.length) {
    jobs.forEach((job) => {
      if (job.state.runId === job.runId) job.state.busy = false;
    });
    return false;
  }

  return true;
}

function prepareWheelJob(card, {
  rowIndex,
  columnIndex,
  rowOrdinal,
  desired,
  sequence,
  delay,
  ordinal,
  duration,
}) {
  const state = card._cellStates[rowIndex]?.[columnIndex];
  const refs = card._cells[rowIndex]?.[columnIndex];
  if (!state || !refs || sequence.length === 0) return null;

  const runId = (state.runId || 0) + 1;
  state.runId = runId;
  state.busy = true;
  state.pending = desired;

  return {
    rowIndex,
    columnIndex,
    rowOrdinal,
    desired,
    state,
    refs,
    runId,
    sequence,
    index: 0,
    delay,
    ordinal,
    duration,
  };
}

async function fallbackFlip(card, refs, fromToken, toToken, duration, cancelState) {
  const halfDuration = Math.max(32, Math.round(duration / 2));
  card._renderToken(refs.topStatic, fromToken);
  card._renderToken(refs.bottomStatic, fromToken);
  card._renderToken(refs.upperFlap, fromToken);
  card._renderToken(refs.lowerFlap, toToken);

  refs.root.style.setProperty('--flip-half-duration', `${halfDuration}ms`);
  refs.root.classList.remove('is-flipping');
  await nextFrame();
  if (cancelState.cancelled) return false;
  refs.root.classList.add('is-flipping');
  await sleep(halfDuration);
  if (cancelState.cancelled) return false;
  card._renderToken(refs.topStatic, toToken);
  await sleep(halfDuration + 20);
  if (cancelState.cancelled) return false;
  refs.root.classList.remove('is-flipping');
  card._renderToken(refs.bottomStatic, toToken);
  return true;
}

export const performanceAnimationMethods = {
  async _flipCell(refs, fromValue, toValue, duration) {
    const fromToken = normaliseToken(fromValue);
    const toToken = normaliseToken(toValue);
    const safeDuration = Math.max(84, Math.trunc(Number(duration) || 118));
    const halfDuration = Math.max(38, Math.round(safeDuration / 2));

    const upper = refs.upperElement || refs.root.querySelector('.flip-upper');
    const lower = refs.lowerElement || refs.root.querySelector('.flip-lower');
    const body = refs.bodyElement || refs.root.querySelector('.flap-cell-body');
    refs.upperElement = upper;
    refs.lowerElement = lower;
    refs.bodyElement = body;

    const cancelState = { cancelled: false };
    const animations = [];
    let committed = false;

    const cancel = () => {
      cancelState.cancelled = true;
      animations.forEach((animation) => {
        try { animation.cancel(); } catch (_error) { /* no-op */ }
      });
    };
    this._activeFlips.add(cancel);

    try {
      this._renderToken(refs.topStatic, fromToken);
      this._renderToken(refs.bottomStatic, fromToken);
      this._renderToken(refs.upperFlap, fromToken);
      this._renderToken(refs.lowerFlap, toToken);

      refs.root.classList.remove('is-flipping');

      if (!upper || !lower || typeof upper.animate !== 'function' || typeof lower.animate !== 'function') {
        committed = await fallbackFlip(this, refs, fromToken, toToken, safeDuration, cancelState);
        return committed;
      }

      upper.style.opacity = '1';
      lower.style.opacity = '0';
      upper.style.willChange = 'transform';
      lower.style.willChange = 'transform';
      if (body) body.style.willChange = 'transform';

      const upperAnimation = upper.animate(
        [
          { transform: 'rotateX(0deg)', opacity: 1 },
          { transform: 'rotateX(-90deg)', opacity: 1 },
        ],
        {
          duration: halfDuration,
          easing: 'cubic-bezier(.55,.06,.68,.19)',
          fill: 'forwards',
        }
      );
      animations.push(upperAnimation);

      if (body && typeof body.animate === 'function') {
        const impact = body.animate(
          [
            { transform: 'translateY(0)' },
            { offset: 0.5, transform: 'translateY(.35px)' },
            { transform: 'translateY(0)' },
          ],
          { duration: safeDuration, easing: 'cubic-bezier(.22,.61,.36,1)' }
        );
        animations.push(impact);
      }

      await animationFinished(upperAnimation);
      if (cancelState.cancelled) return false;

      this._renderToken(refs.topStatic, toToken);
      upper.style.opacity = '0';
      lower.style.opacity = '1';

      const lowerAnimation = lower.animate(
        [
          { transform: 'rotateX(90deg)', opacity: 1 },
          { transform: 'rotateX(0deg)', opacity: 1 },
        ],
        {
          duration: halfDuration,
          easing: 'cubic-bezier(.22,.61,.36,1)',
          fill: 'forwards',
        }
      );
      animations.push(lowerAnimation);

      await animationFinished(lowerAnimation);
      if (cancelState.cancelled) return false;

      this._renderToken(refs.bottomStatic, toToken);
      committed = true;
      return true;
    } finally {
      animations.forEach((animation) => {
        try { animation.cancel(); } catch (_error) { /* no-op */ }
      });
      if (upper) {
        upper.style.opacity = '0';
        upper.style.willChange = '';
      }
      if (lower) {
        lower.style.opacity = '0';
        lower.style.willChange = '';
      }
      if (body) body.style.willChange = '';
      refs.root.classList.remove('is-flipping');
      const stable = committed ? toToken : fromToken;
      this._renderToken(refs.topStatic, stable);
      this._renderToken(refs.bottomStatic, stable);
      this._activeFlips.delete(cancel);
    }
  },

  async _runWheelInitialBuild(buildRunId) {
    if (!this._rendered || !this._hass || !this.isConnected) return false;

    this._updateHeading();
    const targetRows = this._targetRowsForCurrentState();
    const signature = tokenSignature(targetRows);
    this._cancelAnimations();
    const generation = this._animationGeneration;
    const seed = ++this._initialVariationSeed;

    const candidates = [];
    targetRows.forEach((row, rowIndex) => {
      let rowOrdinal = 0;
      row.forEach((target, columnIndex) => {
        const state = this._cellStates[rowIndex]?.[columnIndex];
        if (!state) return;
        const desired = normaliseToken(target);
        if (!tokensEqual(state.current, desired)) {
          candidates.push({ rowIndex, columnIndex, rowOrdinal, desired });
          rowOrdinal += 1;
        }
      });
    });

    const populatedCharacterCount = candidates.filter(({ desired }) => desired.type === 'char' && desired.value !== ' ').length;
    const bounds = wheelStepBounds(this._config, populatedCharacterCount);
    const charset = CHARSETS[this._config.character_set] || CHARSETS.airport_de;
    const duration = Math.max(88, this._config.step_duration);

    const jobs = candidates.map((item, ordinal) => {
      const delay = initialStartDelay({
        pattern: this._config.initial_start_pattern,
        rowIndex: item.rowIndex,
        columnIndex: item.columnIndex,
        rowOrdinal: item.rowOrdinal,
        ordinal,
        rowStagger: this._config.initial_row_stagger,
        cellStagger: this._config.initial_cell_stagger,
        spread: Math.min(this._config.initial_start_spread, 240),
        seed,
      });

      let sequence;
      let jobDuration = duration;
      if (item.desired.type === 'char') {
        const characters = initialWheelSequence({
          charset,
          targetCharacter: item.desired.value,
          mode: this._config.initial_wheel_mode,
          minSteps: bounds.minSteps,
          maxSteps: bounds.maxSteps,
          rowIndex: item.rowIndex,
          columnIndex: item.columnIndex,
          seed,
        });
        sequence = characters.map((character) => charToken(character, item.desired.color));
      } else {
        sequence = [item.desired];
        jobDuration = Math.max(96, this._config.initial_flip_duration);
      }

      return prepareWheelJob(this, {
        ...item,
        sequence,
        delay,
        ordinal,
        duration: jobDuration,
      });
    }).filter(Boolean);

    const completed = await runFlowingWheel(this, jobs, generation, buildRunId);
    if (completed) this._targetSignature = signature;
    return completed;
  },

  async _runReplayBuild(buildRunId) {
    if (!this._rendered || !this._hass || !this.isConnected) return false;

    this._updateHeading();
    const generation = this._animationGeneration;
    const seed = ++this._initialVariationSeed;
    const targetRows = this._targetRowsForCurrentState();
    const signature = tokenSignature(targetRows);
    const charset = CHARSETS[this._config.character_set] || CHARSETS.airport_de;

    const candidates = [];
    this._cellStates.forEach((row, rowIndex) => {
      let rowOrdinal = 0;
      row.forEach((state, columnIndex) => {
        const current = normaliseToken(state.current);
        if (current.type !== 'char' || current.value === ' ') return;
        candidates.push({ rowIndex, columnIndex, rowOrdinal, desired: current });
        rowOrdinal += 1;
      });
    });

    const bounds = wheelStepBounds(this._config, candidates.length);
    const duration = Math.max(88, this._config.step_duration);
    const jobs = candidates.map((item, ordinal) => {
      const delay = initialStartDelay({
        pattern: this._config.initial_start_pattern,
        rowIndex: item.rowIndex,
        columnIndex: item.columnIndex,
        rowOrdinal: item.rowOrdinal,
        ordinal,
        rowStagger: Math.min(this._config.initial_row_stagger, 90),
        cellStagger: this._config.initial_cell_stagger,
        spread: Math.min(this._config.initial_start_spread, 180),
        seed,
      });
      const characters = initialWheelSequence({
        charset,
        targetCharacter: item.desired.value,
        mode: 'short',
        minSteps: bounds.minSteps,
        maxSteps: bounds.maxSteps,
        rowIndex: item.rowIndex,
        columnIndex: item.columnIndex,
        seed,
      });
      const sequence = characters.map((character) => charToken(character, item.desired.color));
      return prepareWheelJob(this, {
        ...item,
        sequence,
        delay,
        ordinal,
        duration,
      });
    }).filter(Boolean);

    const completed = await runFlowingWheel(this, jobs, generation, buildRunId);
    if (completed) this._targetSignature = signature;
    return completed;
  },

  _scheduleInitialBuild(delay = this._config.initial_animation_delay, options = {}) {
    if (!this._rendered || !this._hass) return;

    const replay = options.replay === true;
    this._cancelInitialAnimationTimer();
    const buildRunId = this._initialBuildRunId;

    if (!replay) this._primeBoardWithFillCharacter();
    this._initialRefreshQueued = false;
    this._initialAnimationPending = true;
    this._hasPlayedInitialBuild = false;

    const effectiveDelay = replay ? Math.min(80, Math.max(0, delay)) : Math.max(0, delay);
    const timer = window.setTimeout(async () => {
      if (this._initialAnimationTimer !== timer || buildRunId !== this._initialBuildRunId) return;

      this._initialAnimationTimer = null;
      let completed = false;

      try {
        completed = replay
          ? await this._runReplayBuild(buildRunId)
          : this._config.initial_animation_style === 'wheel'
            ? await this._runWheelInitialBuild(buildRunId)
            : await this._runDirectInitialBuild(buildRunId);
      } finally {
        if (buildRunId !== this._initialBuildRunId) return;
        this._initialAnimationPending = false;

        if (!completed && this.isConnected && this._rendered) {
          const fallbackRows = this._targetRowsForCurrentState();
          this._applyRowsImmediately(fallbackRows, tokenSignature(fallbackRows));
          completed = true;
        }

        this._hasPlayedInitialBuild = completed;
        if (this._initialRefreshQueued && completed) {
          this._initialRefreshQueued = false;
          this._updateBoard(false);
        }
      }
    }, effectiveDelay);

    this._initialAnimationTimer = timer;
  },

  _replayInitialAnimation() {
    if (!this._config?.replay_on_tap || !this._rendered || !this._hass) return;
    if (this._initialAnimationPending || this._liveUpdateRunning) return;
    this._hasPlayedInitialBuild = false;
    this._scheduleInitialBuild(0, { replay: true });
  },
};