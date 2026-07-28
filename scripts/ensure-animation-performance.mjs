import fs from 'node:fs';

function update(path, transform) {
  const source = fs.readFileSync(path, 'utf8');
  const changed = transform(source);
  if (changed !== source) fs.writeFileSync(path, changed);
}

update('split-flap-config.js', (source) => {
  let result = source;

  if (!result.includes("from './split-flap-performance-profile.js")) {
    result = result.replace(
      /(import \{ INITIAL_START_PATTERNS \} from '\.\/split-flap-start-patterns\.js\?v=[^']+';)/,
      `$1\nimport { ANIMATION_PERFORMANCE_MODES } from './split-flap-performance-profile.js?v=0.2.29';`
    );
  }

  if (!result.includes("animation_performance: 'auto'")) {
    result = result.replace(
      '      initial_max_parallel_cells: 24,\n      replay_on_tap: false,',
      "      initial_max_parallel_cells: 24,\n      animation_performance: 'auto',\n      replay_on_tap: false,"
    );
  }

  if (!result.includes("'animation_performance' must be one of")) {
    result = result.replace(
      '    normalised.animate_on_first_load = normalised.animate_on_first_load !== false;',
      `    normalised.animation_performance = String(
      normalised.animation_performance || 'auto'
    ).toLowerCase();
    if (!ANIMATION_PERFORMANCE_MODES.includes(normalised.animation_performance)) {
      throw new Error(
        "split-flap-display-card: 'animation_performance' must be one of " +
        ANIMATION_PERFORMANCE_MODES.join(', ') + '.'
      );
    }

    normalised.animate_on_first_load = normalised.animate_on_first_load !== false;`
    );
  }

  return result;
});

update('split-flap-render.js', (source) => {
  if (source.includes('upperElement: cellElement.querySelector')) return source;

  return source.replace(
    `          lowerFlap: cellElement.querySelector('.flip-lower .cell-content'),
        };`,
    `          lowerFlap: cellElement.querySelector('.flip-lower .cell-content'),
          upperElement: cellElement.querySelector('.flip-upper'),
          lowerElement: cellElement.querySelector('.flip-lower'),
          bodyElement: cellElement.querySelector('.flap-cell-body'),
        };`
  );
});

update('split-flap-flow-scheduler.js', (source) => {
  let result = source;

  if (!result.includes("from './split-flap-performance-profile.js")) {
    result = `import { animationPerformanceProfile } from './split-flap-performance-profile.js?v=0.2.29';\n\n${result}`;
  }

  result = result.replace(
    /export function effectiveFlowParallelLimit\(config, jobCount\) \{[\s\S]*?\n\}/,
    `export function effectiveFlowParallelLimit(config, jobCount) {
  const requested = Math.max(1, Math.trunc(Number(config.initial_max_parallel_cells) || 24));
  const hardware = typeof navigator !== 'undefined' && Number.isFinite(navigator.hardwareConcurrency)
    ? navigator.hardwareConcurrency
    : 8;
  const adaptiveCap = Math.max(8, Math.min(24, hardware * 2));
  const boardCap = jobCount > 260 ? 12 : jobCount > 140 ? 16 : 20;
  const profile = animationPerformanceProfile(config, jobCount);
  return Math.max(1, Math.min(requested, adaptiveCap, boardCap, profile.parallelCap));
}`
  );

  return result;
});

update('split-flap-performance.js', (source) => {
  let result = source;

  if (!result.includes("from './split-flap-performance-profile.js")) {
    result = result.replace(
      /(import \{ runFlowingWheel \} from '\.\/split-flap-flow-scheduler\.js\?v=[^']+';)/,
      `$1\nimport { animationPerformanceProfile } from './split-flap-performance-profile.js?v=0.2.29';`
    );
  }

  result = result.replace(
    /export function wheelStepBounds\(config, populatedCells\) \{[\s\S]*?\n\}/,
    `export function wheelStepBounds(config, populatedCells) {
  const configuredMin = Math.max(1, Math.trunc(Number(config.initial_wheel_steps_min) || 3));
  const configuredMax = Math.max(configuredMin, Math.trunc(Number(config.initial_wheel_steps_max) || 6));
  const profile = animationPerformanceProfile(config, populatedCells);
  let maxSteps = configuredMax;
  let minSteps = configuredMin;

  if (populatedCells > 220) {
    minSteps = Math.min(minSteps, 2);
    maxSteps = Math.min(maxSteps, 4);
  } else if (populatedCells > 120) {
    minSteps = Math.min(minSteps, 3);
    maxSteps = Math.min(maxSteps, 5);
  }

  maxSteps = Math.max(1, Math.min(maxSteps, profile.maxWheelSteps));
  minSteps = Math.max(1, Math.min(minSteps, maxSteps));
  return { minSteps, maxSteps };
}`
  );

  result = result.replace(
    `    const safeDuration = Math.max(84, Math.trunc(Number(duration) || 118));
    const halfDuration = Math.max(38, Math.round(safeDuration / 2));`,
    `    const profile = this._activeAnimationPerformanceProfile ||
      animationPerformanceProfile(this._config, 1);
    const safeDuration = Math.max(
      profile.minimumDuration,
      Math.trunc(Number(duration) || 118)
    );
    const halfDuration = Math.max(24, Math.round(safeDuration / 2));`
  );

  result = result.replace(
    `      this._renderToken(refs.topStatic, fromToken);
      this._renderToken(refs.bottomStatic, fromToken);
      this._renderToken(refs.upperFlap, fromToken);`,
    `      this._renderToken(refs.upperFlap, fromToken);`
  );

  result = result.replace(
    `      if (body) body.style.willChange = 'transform';`,
    `      if (body && profile.animateImpact) body.style.willChange = 'transform';`
  );

  result = result.replace(
    `      if (body && typeof body.animate === 'function') {`,
    `      if (profile.animateImpact && body && typeof body.animate === 'function') {`
  );

  result = result.replace(
    `      const stable = committed ? toToken : fromToken;
      this._renderToken(refs.topStatic, stable);
      this._renderToken(refs.bottomStatic, stable);`,
    `      if (!committed) {
        this._renderToken(refs.topStatic, fromToken);
        this._renderToken(refs.bottomStatic, fromToken);
      }`
  );

  result = result.replace(
    `    const populatedCharacterCount = candidates.filter(({ desired }) => desired.type === 'char' && desired.value !== ' ').length;
    const bounds = wheelStepBounds(this._config, populatedCharacterCount);
    const charset = CHARSETS[this._config.character_set] || CHARSETS.airport_de;
    const duration = Math.max(88, this._config.step_duration);`,
    `    const populatedCharacterCount = candidates.filter(({ desired }) => desired.type === 'char' && desired.value !== ' ').length;
    const performanceProfile = animationPerformanceProfile(this._config, candidates.length);
    const bounds = wheelStepBounds(this._config, populatedCharacterCount);
    const charset = CHARSETS[this._config.character_set] || CHARSETS.airport_de;
    const duration = Math.max(performanceProfile.minimumDuration, this._config.step_duration);`
  );

  result = result.replace(
    `    const completed = await runFlowingWheel(this, jobs, generation, buildRunId);
    if (completed) this._targetSignature = signature;
    return completed;
  },

  async _runReplayBuild`,
    `    const instrument = this.shadowRoot?.querySelector('.instrument');
    this._activeAnimationPerformanceProfile = performanceProfile;
    instrument?.classList.add('is-animation-running', \`performance-\${performanceProfile.mode}\`);

    try {
      const completed = await runFlowingWheel(this, jobs, generation, buildRunId);
      if (completed) this._targetSignature = signature;
      return completed;
    } finally {
      instrument?.classList.remove(
        'is-animation-running',
        'performance-quality',
        'performance-balanced',
        'performance-fast'
      );
      this._activeAnimationPerformanceProfile = null;
    }
  },

  async _runReplayBuild`
  );

  result = result.replace(
    `    const bounds = wheelStepBounds(this._config, candidates.length);
    const duration = Math.max(88, this._config.step_duration);`,
    `    const performanceProfile = animationPerformanceProfile(this._config, candidates.length);
    const bounds = wheelStepBounds(this._config, candidates.length);
    const duration = Math.max(performanceProfile.minimumDuration, this._config.step_duration);`
  );

  result = result.replace(
    `    const completed = await runFlowingWheel(this, jobs, generation, buildRunId);
    if (completed) this._targetSignature = signature;
    return completed;
  },

  _scheduleInitialBuild`,
    `    const instrument = this.shadowRoot?.querySelector('.instrument');
    this._activeAnimationPerformanceProfile = performanceProfile;
    instrument?.classList.add('is-animation-running', \`performance-\${performanceProfile.mode}\`);

    try {
      const completed = await runFlowingWheel(this, jobs, generation, buildRunId);
      if (completed) this._targetSignature = signature;
      return completed;
    } finally {
      instrument?.classList.remove(
        'is-animation-running',
        'performance-quality',
        'performance-balanced',
        'performance-fast'
      );
      this._activeAnimationPerformanceProfile = null;
    }
  },

  _scheduleInitialBuild`
  );

  return result;
});

update('split-flap-styles.js', (source) => {
  if (source.includes('.instrument.is-animation-running.performance-fast')) return source;

  return source.replace(
    '    @keyframes flap-upper {',
    `    /*
     * Large filtered instruments are expensive while dozens of descendants
     * animate. Balanced and fast profiles temporarily remove purely cosmetic
     * effects; the full photorealistic appearance returns when animation ends.
     */
    .instrument.is-animation-running.performance-balanced,
    .instrument.is-animation-running.performance-fast {
      filter: none;
    }

    .instrument.is-animation-running.performance-balanced .cell-glass,
    .instrument.is-animation-running.performance-fast .cell-glass {
      opacity: 0;
    }

    .instrument.is-animation-running.performance-fast .flap-cell-body {
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.05),
        inset 0 -2px 3px rgba(0,0,0,0.84);
    }

    .instrument.is-animation-running.performance-fast .cell-content {
      text-shadow: 0 1px 1px rgba(0,0,0,0.88);
    }

    .instrument.is-animation-running.performance-fast .cell-content ha-icon {
      filter: none;
    }

    @keyframes flap-upper {`
  );
});

update('examples/openpublictransport-departure-board.yaml', (source) => {
  if (source.includes('animation_performance:')) return source;

  return source.replace(
    '# Maximum requested number of simultaneously moving startup cells.\ninitial_max_parallel_cells: 24',
    `# Maximum requested number of simultaneously moving startup cells.
initial_max_parallel_cells: 24

# Controls CPU/GPU load during the animation.
# auto selects quality, balanced or fast from board size and CPU threads.
# Use fast explicitly on older PCs, wall panels or very wide boards.
animation_performance: auto`
  );
});

update('examples/video-recording-demo.yaml', (source) => {
  if (source.includes('animation_performance:')) return source;

  return source.replace(
    '# Maximum requested number of simultaneously moving startup cells.\n# The runtime may reduce this automatically on a large board or slower device.\ninitial_max_parallel_cells: 24',
    `# Maximum requested number of simultaneously moving startup cells.
# The runtime may reduce this automatically on a large board or slower device.
initial_max_parallel_cells: 24

# Keeps the recording smooth on large boards while preserving the flap motion.
animation_performance: balanced`
  );
});

update('README.md', (source) => {
  let result = source;

  if (!result.includes('### Animation performance profiles')) {
    result = result.replace(
      '### Replay\n',
      `### Animation performance profiles

Large boards can contain several hundred physical cells. Each active cell has two 3D flap halves, so unrestricted parallel animation can overload an older GPU even when the JavaScript scheduler itself is fast.

\`\`\`yaml
# auto: selects a profile from board size and available CPU threads.
# quality: full effects and maximum parallelism.
# balanced: removes expensive temporary effects and reduces parallelism.
# fast: lowest animation load for older PCs and large wall dashboards.
animation_performance: auto
\`\`\`

The balanced and fast profiles temporarily disable the instrument-level drop-shadow filter, glass overlays and impact animation while the flaps move. The complete photorealistic appearance returns immediately after the animation settles.

For a visibly struggling browser, use:

\`\`\`yaml
animation_performance: fast
initial_wheel_steps_min: 1
initial_wheel_steps_max: 2
initial_max_parallel_cells: 8
step_duration: 52
\`\`\`

### Replay
`
    );
  }

  if (!result.includes('| `animation_performance` | `auto` |')) {
    result = result.replace(
      '| `initial_max_parallel_cells` | `24` | Requested maximum simultaneous startup cells; the runtime may adapt it down |',
      '| `initial_max_parallel_cells` | `24` | Requested maximum simultaneous startup cells; the runtime may adapt it down |\n| `animation_performance` | `auto` | `auto`, `quality`, `balanced` or `fast` CPU/GPU profile |'
    );
  }

  if (!result.includes('animation_performance: auto')) {
    result = result.replace(
      '# Maximum number of simultaneously moving startup cells.\ninitial_max_parallel_cells: 24',
      `# Maximum number of simultaneously moving startup cells.
initial_max_parallel_cells: 24

# Selects an adaptive CPU/GPU performance profile.
animation_performance: auto`
    );
  }

  return result;
});
