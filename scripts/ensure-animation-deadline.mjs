import fs from 'node:fs';

function update(path, transform) {
  const source = fs.readFileSync(path, 'utf8');
  const changed = transform(source);
  if (changed !== source) fs.writeFileSync(path, changed);
}

update('split-flap-config.js', (source) => {
  let result = source;

  if (!result.includes('initial_animation_max_duration: 4000')) {
    result = result.replace(
      '      initial_animation_delay: 450,\n      initial_fill_char:',
      '      initial_animation_delay: 450,\n      initial_animation_max_duration: 4000,\n      initial_fill_char:'
    );
  }

  if (!result.includes('normalised.initial_animation_max_duration = boundedInteger')) {
    result = result.replace(
      `    normalised.initial_flip_duration = boundedInteger(
      normalised.initial_flip_duration,`,
      `    normalised.initial_animation_max_duration = boundedInteger(
      normalised.initial_animation_max_duration,
      0,
      30000,
      4000
    );
    normalised.initial_flip_duration = boundedInteger(
      normalised.initial_flip_duration,`
    );
  }

  return result;
});

update('split-flap-display-card.js', (source) => {
  let result = source;

  if (!result.includes('this._initialDeadlineTimer = null;')) {
    result = result.replace(
      '    this._initialAnimationTimer = null;\n    this._initialAnimationPending = false;',
      '    this._initialAnimationTimer = null;\n    this._initialDeadlineTimer = null;\n    this._initialAnimationPending = false;'
    );
  }

  if (!result.includes('initial_animation_max_duration: 4000')) {
    result = result.replace(
      '      initial_animation_delay: 450,\n      initial_flip_duration: 220,',
      '      initial_animation_delay: 450,\n      initial_animation_max_duration: 4000,\n      initial_flip_duration: 220,'
    );
  }

  if (!result.includes("window.clearTimeout(this._initialDeadlineTimer)")) {
    result = result.replace(
      `    if (this._initialAnimationTimer !== null) {
      window.clearTimeout(this._initialAnimationTimer);
      this._initialAnimationTimer = null;
    }
    this._initialAnimationPending = false;`,
      `    if (this._initialAnimationTimer !== null) {
      window.clearTimeout(this._initialAnimationTimer);
      this._initialAnimationTimer = null;
    }
    if (this._initialDeadlineTimer !== null) {
      window.clearTimeout(this._initialDeadlineTimer);
      this._initialDeadlineTimer = null;
    }
    this._initialAnimationPending = false;`
    );
  }

  return result;
});

update('split-flap-performance.js', (source) => {
  let result = source;

  if (!result.includes('const clearInitialDeadline = () =>')) {
    result = result.replace(
      `    const effectiveDelay = replay ? Math.min(80, Math.max(0, delay)) : Math.max(0, delay);
    const timer = window.setTimeout(async () => {`,
      `    const effectiveDelay = replay ? Math.min(80, Math.max(0, delay)) : Math.max(0, delay);
    const clearInitialDeadline = () => {
      if (this._initialDeadlineTimer !== null) {
        window.clearTimeout(this._initialDeadlineTimer);
        this._initialDeadlineTimer = null;
      }
    };
    const timer = window.setTimeout(async () => {`
    );

    result = result.replace(
      `      } finally {
        if (buildRunId !== this._initialBuildRunId) return;`,
      `      } finally {
        clearInitialDeadline();
        if (buildRunId !== this._initialBuildRunId) return;`
    );

    result = result.replace(
      `    this._initialAnimationTimer = timer;
  },`,
      `    this._initialAnimationTimer = timer;

    const maximumDuration = Math.max(
      0,
      Math.trunc(Number(this._config.initial_animation_max_duration) || 0)
    );

    if (maximumDuration > 0) {
      this._initialDeadlineTimer = window.setTimeout(() => {
        if (
          buildRunId !== this._initialBuildRunId ||
          !this._initialAnimationPending ||
          !this._rendered ||
          !this.isConnected
        ) {
          return;
        }

        this._initialDeadlineTimer = null;
        window.clearTimeout(timer);
        if (this._initialAnimationTimer === timer) this._initialAnimationTimer = null;

        const finalRows = this._targetRowsForCurrentState();
        this._applyRowsImmediately(finalRows, tokenSignature(finalRows));
        this._initialAnimationPending = false;
        this._hasPlayedInitialBuild = true;

        if (this._initialRefreshQueued) {
          this._initialRefreshQueued = false;
          this._updateBoard(false);
        }
      }, maximumDuration);
    }
  },`
    );
  }

  return result;
});

update('examples/openpublictransport-departure-board.yaml', (source) => {
  if (source.includes('initial_animation_max_duration:')) return source;

  return source.replace(
    '# Keeps the empty board visible briefly before movement begins.\ninitial_animation_delay: 700',
    `# Keeps the empty board visible briefly before movement begins.
initial_animation_delay: 250

# Hard deadline from scheduling to the fully populated final board.
# If the browser or GPU cannot finish in time, remaining cells settle immediately.
initial_animation_max_duration: 4000`
  );
});

update('examples/video-recording-demo.yaml', (source) => {
  if (source.includes('initial_animation_max_duration:')) return source;

  return source.replace(
    '# Keeps the empty board visible before the first flap starts.\n# Increase this value when a longer clean opening shot is required.\ninitial_animation_delay: 700',
    `# Keeps the empty board visible before the first flap starts.
initial_animation_delay: 250

# Guarantees that the finished board is visible no later than four seconds
# after the startup sequence was scheduled.
initial_animation_max_duration: 4000`
  );
});

update('README.md', (source) => {
  let result = source;

  if (!result.includes('| `initial_animation_max_duration` | `4000` |')) {
    result = result.replace(
      '| `initial_animation_delay` | `450` | Delay before startup begins, in ms |',
      `| \`initial_animation_delay\` | \`450\` | Delay before startup begins, in ms |
| \`initial_animation_max_duration\` | \`4000\` | Hard startup deadline in ms; unfinished cells settle immediately on the final snapshot |`
    );
  }

  if (!result.includes('### Hard startup deadline')) {
    result = result.replace(
      '### Smooth startup flow\n',
      `### Hard startup deadline

\`initial_animation_max_duration\` sets an upper wall-clock limit for the complete first-load build, including the initial delay. When the deadline is reached, active flap animations are cancelled and every remaining cell is committed immediately to the latest complete Home Assistant snapshot. A value of \`0\` disables the deadline.

For a four-second maximum:

\`\`\`yaml
initial_animation_max_duration: 4000
\`\`\`

### Smooth startup flow
`
    );
  }

  return result;
});
