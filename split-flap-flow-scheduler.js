import { animationPerformanceProfile } from './split-flap-performance-profile.js?v=0.2.31';

const timerHost = (
  typeof window !== 'undefined' && typeof window.setTimeout === 'function'
    ? window
    : globalThis
);

const sleep = (milliseconds) => new Promise((resolve) => {
  timerHost.setTimeout(resolve, milliseconds);
});

const now = () => (
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
);

const nextFrame = () => new Promise((resolve) => {
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => resolve());
  } else {
    timerHost.setTimeout(resolve, 16);
  }
});

export function effectiveFlowParallelLimit(config, jobCount) {
  const requested = Math.max(1, Math.trunc(Number(config.initial_max_parallel_cells) || 24));
  const hardware = typeof navigator !== 'undefined' && Number.isFinite(navigator.hardwareConcurrency)
    ? navigator.hardwareConcurrency
    : 8;
  const adaptiveCap = Math.max(8, Math.min(24, hardware * 2));
  const boardCap = jobCount > 260 ? 12 : jobCount > 140 ? 16 : 20;
  const profile = animationPerformanceProfile(config, jobCount);
  return Math.max(1, Math.min(requested, adaptiveCap, boardCap, profile.parallelCap));
}

async function runCompleteJob(card, job, valid) {
  if (!valid() || job.state.runId !== job.runId) return false;

  for (const nextToken of job.sequence) {
    if (!valid() || job.state.runId !== job.runId) return false;

    const committed = await card._flipCell(
      job.refs,
      job.state.current,
      nextToken,
      job.duration
    );

    if (!committed || !valid() || job.state.runId !== job.runId) return false;
    job.state.current = nextToken;
  }

  return true;
}

export async function runFlowingWheel(card, jobs, generation, buildRunId) {
  if (jobs.length === 0) return true;

  const concurrency = effectiveFlowParallelLimit(card._config, jobs.length);
  const pending = jobs
    .slice()
    .sort((left, right) => left.delay - right.delay || left.rowIndex - right.rowIndex || left.rowOrdinal - right.rowOrdinal || left.ordinal - right.ordinal);
  const running = new Set();
  const startTime = now();
  let failed = false;
  let completed = 0;

  const valid = () => (
    !failed &&
    buildRunId === card._initialBuildRunId &&
    generation === card._animationGeneration &&
    card._rendered &&
    card.isConnected
  );

  const finish = (job, success) => {
    if (job.state.runId === job.runId) {
      job.state.busy = false;
      job.state.pending = null;
    }
    if (success) completed += 1;
    else failed = true;
  };

  const launch = (job) => {
    let task;
    task = runCompleteJob(card, job, valid)
      .then((success) => finish(job, success))
      .catch(() => finish(job, false))
      .finally(() => running.delete(task));
    running.add(task);
  };

  while (valid() && (pending.length > 0 || running.size > 0)) {
    const elapsed = now() - startTime;

    while (
      pending.length > 0 &&
      pending[0].delay <= elapsed &&
      running.size < concurrency &&
      valid()
    ) {
      launch(pending.shift());
    }

    if (!valid()) break;

    if (running.size >= concurrency || (running.size > 0 && pending.length === 0)) {
      await Promise.race(running);
      await nextFrame();
      continue;
    }

    if (pending.length > 0) {
      const wait = Math.max(1, Math.min(16, pending[0].delay - (now() - startTime)));
      if (running.size > 0) {
        await Promise.race([
          Promise.race(running),
          sleep(wait),
        ]);
      } else {
        await sleep(wait);
      }
      continue;
    }

    if (running.size > 0) await Promise.race(running);
  }

  await Promise.allSettled([...running]);

  if (!valid() || failed || completed !== jobs.length) {
    jobs.forEach((job) => {
      if (job.state.runId === job.runId) {
        job.state.busy = false;
        job.state.pending = null;
      }
    });
    return false;
  }

  return true;
}
