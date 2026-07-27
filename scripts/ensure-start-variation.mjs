import fs from 'node:fs';

function update(path, transform) {
  const source = fs.readFileSync(path, 'utf8');
  const changed = transform(source);
  if (changed !== source) fs.writeFileSync(path, changed);
}

update('split-flap-display-card.js', (source) => {
  let result = source;

  if (!result.includes("from './split-flap-start-patterns.js")) {
    result = result.replace(
      /(import \{ buildTransportBadgeStyles, renderBuiltInTransportBadge \} from '\.\/split-flap-transport-badges\.js\?v=[^']+';)/,
      `$1\nimport { initialStartDelay } from './split-flap-start-patterns.js?v=0.2.20';`
    );
  }

  if (!result.includes('this._initialVariationSeed = 0;')) {
    result = result.replace(
      '    this._hasPlayedInitialBuild = false;\n',
      '    this._hasPlayedInitialBuild = false;\n    this._initialVariationSeed = 0;\n'
    );
  }

  if (!result.includes("initial_start_pattern: 'mixed'")) {
    result = result.replace(
      '      initial_row_stagger: 120,\n',
      "      initial_row_stagger: 120,\n      initial_start_pattern: 'mixed',\n      initial_start_spread: 420,\n      initial_cell_stagger: 9,\n"
    );
  }

  const oldMethod = `  async _runWheelInitialBuild() {
    const targetRows = this._targetRowsForCurrentState();
    const signature = tokenSignature(targetRows);
    return this._runLiveTransition(targetRows, signature, 'wheel');
  }`;

  const newMethod = `  async _runWheelInitialBuild(buildRunId) {
    if (!this._rendered || !this._hass || !this.isConnected) return false;

    this._updateHeading();
    const targetRows = this._targetRowsForCurrentState();
    const signature = tokenSignature(targetRows);

    this._cancelAnimations();
    const generation = this._animationGeneration;
    const seed = ++this._initialVariationSeed;
    const changes = [];

    targetRows.forEach((row, rowIndex) => {
      row.forEach((target, columnIndex) => {
        const state = this._cellStates[rowIndex]?.[columnIndex];
        if (!state) return;

        const desired = normaliseToken(target);
        if (!tokensEqual(state.current, desired)) {
          changes.push({ rowIndex, columnIndex, desired });
        }
      });
    });

    const results = await Promise.all(
      changes.map(async (item, ordinal) => {
        const delay = initialStartDelay({
          pattern: this._config.initial_start_pattern,
          rowIndex: item.rowIndex,
          columnIndex: item.columnIndex,
          ordinal,
          rowStagger: this._config.initial_row_stagger,
          cellStagger: this._config.initial_cell_stagger,
          spread: this._config.initial_start_spread,
          seed,
        });

        if (delay > 0) await sleep(delay);

        if (
          buildRunId !== this._initialBuildRunId ||
          generation !== this._animationGeneration ||
          !this.isConnected
        ) {
          return false;
        }

        return this._animateCellWheelTo(
          item.rowIndex,
          item.columnIndex,
          item.desired,
          generation
        );
      })
    );

    const completed = results.every(Boolean) &&
      buildRunId === this._initialBuildRunId &&
      generation === this._animationGeneration &&
      this.isConnected;

    if (completed) this._targetSignature = signature;
    return completed;
  }`;

  if (result.includes(oldMethod)) {
    result = result.replace(oldMethod, newMethod);
  }

  result = result.replace(
    '? await this._runWheelInitialBuild()\n',
    '? await this._runWheelInitialBuild(buildRunId)\n'
  );

  return result;
});

update('split-flap-config.js', (source) => {
  let result = source;

  if (!result.includes("from './split-flap-start-patterns.js")) {
    result = result.replace(
      /(import \{ boundedInteger, boundedNumber, safeCssColor \} from '\.\/split-flap-utils\.js\?v=[^']+';)/,
      `$1\nimport { INITIAL_START_PATTERNS } from './split-flap-start-patterns.js?v=0.2.20';`
    );
  }

  if (!result.includes("initial_start_pattern: displayMode === 'departure_board' ? 'mixed' : 'wave'")) {
    result = result.replace(
      '      initial_row_stagger: inheritedInitialRowStagger,\n      replay_on_tap: false,',
      "      initial_row_stagger: inheritedInitialRowStagger,\n      initial_start_pattern: displayMode === 'departure_board' ? 'mixed' : 'wave',\n      initial_start_spread: 420,\n      initial_cell_stagger: 9,\n      replay_on_tap: false,"
    );
  }

  if (!result.includes('normalised.initial_start_spread = boundedInteger(')) {
    result = result.replace(
      `    normalised.initial_row_stagger = boundedInteger(
      normalised.initial_row_stagger,
      0,
      3000,
      120
    );`,
      `    normalised.initial_row_stagger = boundedInteger(
      normalised.initial_row_stagger,
      0,
      3000,
      120
    );
    normalised.initial_start_spread = boundedInteger(
      normalised.initial_start_spread,
      0,
      5000,
      420
    );
    normalised.initial_cell_stagger = boundedInteger(
      normalised.initial_cell_stagger,
      0,
      500,
      9
    );`
    );
  }

  if (!result.includes("'initial_start_pattern' must be one of")) {
    result = result.replace(
      `    if (!['direct', 'wheel'].includes(normalised.initial_animation_style)) {
      throw new Error("split-flap-display-card: 'initial_animation_style' must be 'direct' or 'wheel'.");
    }
`,
      `    if (!['direct', 'wheel'].includes(normalised.initial_animation_style)) {
      throw new Error("split-flap-display-card: 'initial_animation_style' must be 'direct' or 'wheel'.");
    }

    normalised.initial_start_pattern = String(
      normalised.initial_start_pattern ||
      (displayMode === 'departure_board' ? 'mixed' : 'wave')
    ).toLowerCase();
    if (!INITIAL_START_PATTERNS.includes(normalised.initial_start_pattern)) {
      throw new Error(
        "split-flap-display-card: 'initial_start_pattern' must be one of " +
        INITIAL_START_PATTERNS.join(', ') + '.'
      );
    }
`
    );
  }

  return result;
});

update('examples/video-recording-demo.yaml', (source) => {
  let result = source;

  if (!result.includes('initial_start_pattern: mixed')) {
    result = result.replace(
      `# Starts complete rows 150 milliseconds apart.
initial_row_stagger: 150
`,
      `# Keeps a loose top-to-bottom order between rows.
initial_row_stagger: 90

# Gives the startup a controlled irregular mechanical rhythm.
# mixed combines the row order with different start offsets per cell.
initial_start_pattern: mixed

# Maximum additional start offset per populated cell.
initial_start_spread: 480

# Used by the wave pattern; retained here for easy experimentation.
initial_cell_stagger: 9
`
    );
  }

  return result;
});

update('examples/openpublictransport-departure-board.yaml', (source) => {
  let result = source;

  if (!result.includes('initial_start_pattern: mixed')) {
    result = result.replace(
      `# Delay in milliseconds between complete startup rows.
# This is independent of later live sensor updates.
initial_row_stagger: 120
`,
      `# Base delay between startup rows.
initial_row_stagger: 90

# Startup rhythm for wheel mode:
# simultaneous, wave, scatter or mixed.
initial_start_pattern: mixed

# Maximum irregular cell offset in mixed or scatter mode.
initial_start_spread: 420

# Delay per column in wave mode.
initial_cell_stagger: 9
`
    );
  }

  return result;
});

update('README.md', (source) => {
  let result = source;

  if (!result.includes('### Varied wheel startup')) {
    const marker = '### Live sensor updates\n';
    const section = `### Varied wheel startup

For a less uniform airport-board effect, wheel mode can distribute the start times of individual cells while still waiting for every character to reach its final value.

\`\`\`yaml
# Uses the full mechanical character wheel.
initial_animation_style: wheel

# mixed: loose row order plus irregular cell starts.
# Other values: simultaneous, wave, scatter.
initial_start_pattern: mixed

# Base offset between rows.
initial_row_stagger: 90

# Maximum additional irregular delay per populated cell.
initial_start_spread: 420

# Column delay used by the wave pattern.
initial_cell_stagger: 9

# Duration of one character-wheel step.
step_duration: 50
\`\`\`

The offsets are deterministic during one run, but clicking replay generates a new distribution. Sensor updates remain controlled separately by \`live_update_style\`.

`;
    result = result.replace(marker, `${section}${marker}`);
  }

  return result;
});
