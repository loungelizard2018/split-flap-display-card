import fs from 'node:fs';

function update(path, transform) {
  const source = fs.readFileSync(path, 'utf8');
  const changed = transform(source);
  if (changed !== source) fs.writeFileSync(path, changed);
}

update('split-flap-display-card.js', (source) => {
  let result = source;

  if (!result.includes("from './split-flap-wheel-start.js")) {
    result = result.replace(
      /(import \{ initialStartDelay \} from '\.\/split-flap-start-patterns\.js\?v=[^']+';)/,
      `$1\nimport { createConcurrencyGate, initialWheelSequence } from './split-flap-wheel-start.js?v=0.2.21';`
    );
  }

  if (!result.includes('  CHARSETS,\n  charToken,')) {
    result = result.replace(
      'import {\n  charToken,',
      'import {\n  CHARSETS,\n  charToken,'
    );
  }

  const replacement = `  async _runWheelInitialBuild(buildRunId) {
    if (!this._rendered || !this._hass || !this.isConnected) return false;

    this._updateHeading();
    const targetRows = this._targetRowsForCurrentState();
    const signature = tokenSignature(targetRows);

    this._cancelAnimations();
    const generation = this._animationGeneration;
    const seed = ++this._initialVariationSeed;
    const gate = createConcurrencyGate(this._config.initial_max_parallel_cells);
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
        await gate.acquire();

        try {
          if (
            buildRunId !== this._initialBuildRunId ||
            generation !== this._animationGeneration ||
            !this.isConnected
          ) {
            return false;
          }

          return this._animateCellStartupWheelTo(
            item.rowIndex,
            item.columnIndex,
            item.desired,
            generation,
            seed
          );
        } finally {
          gate.release();
        }
      })
    );

    const completed = results.every(Boolean) &&
      buildRunId === this._initialBuildRunId &&
      generation === this._animationGeneration &&
      this.isConnected;

    if (completed) this._targetSignature = signature;
    return completed;
  }

  async _animateCellStartupWheelTo(rowIndex, columnIndex, desiredValue, generation, seed) {
    const state = this._cellStates[rowIndex]?.[columnIndex];
    const refs = this._cells[rowIndex]?.[columnIndex];
    if (!state || !refs) return false;

    const desired = normaliseToken(desiredValue);
    if (tokensEqual(state.current, desired)) return true;

    if (desired.type !== 'char') {
      return this._animateCellDirectTo(
        rowIndex,
        columnIndex,
        desired,
        generation,
        this._config.initial_flip_duration
      );
    }

    const runId = (state.runId || 0) + 1;
    state.runId = runId;
    state.busy = true;
    state.pending = null;

    try {
      const charset = CHARSETS[this._config.character_set] || CHARSETS.airport_de;
      const sequence = initialWheelSequence({
        charset,
        targetCharacter: desired.value,
        mode: this._config.initial_wheel_mode,
        minSteps: this._config.initial_wheel_steps_min,
        maxSteps: this._config.initial_wheel_steps_max,
        rowIndex,
        columnIndex,
        seed,
      });

      for (const nextCharacter of sequence) {
        if (
          generation !== this._animationGeneration ||
          runId !== state.runId ||
          !this.isConnected
        ) {
          return false;
        }

        const nextToken = charToken(nextCharacter, desired.color);
        const committed = await this._flipCell(
          refs,
          state.current,
          nextToken,
          this._config.step_duration
        );

        if (
          !committed ||
          generation !== this._animationGeneration ||
          runId !== state.runId
        ) {
          return false;
        }

        state.current = nextToken;
      }

      return tokensEqual(state.current, desired);
    } finally {
      if (state.runId === runId) state.busy = false;
    }
  }

  _scheduleInitialBuild`;

  result = result.replace(
    /  async _runWheelInitialBuild\(buildRunId\) \{[\s\S]*?\n  _scheduleInitialBuild/,
    replacement
  );

  return result;
});

update('split-flap-config.js', (source) => {
  let result = source;

  result = result.replace(
    "      initial_start_spread: 420,\n      initial_cell_stagger: 9,",
    "      initial_start_spread: 240,\n      initial_cell_stagger: 9,\n      initial_wheel_mode: 'short',\n      initial_wheel_steps_min: 3,\n      initial_wheel_steps_max: 6,\n      initial_max_parallel_cells: 28,"
  );

  if (!result.includes('normalised.initial_wheel_steps_min = boundedInteger')) {
    result = result.replace(
      `    normalised.initial_cell_stagger = boundedInteger(
      normalised.initial_cell_stagger,
      0,
      500,
      9
    );`,
      `    normalised.initial_cell_stagger = boundedInteger(
      normalised.initial_cell_stagger,
      0,
      500,
      9
    );
    normalised.initial_wheel_steps_min = boundedInteger(
      normalised.initial_wheel_steps_min,
      1,
      30,
      3
    );
    normalised.initial_wheel_steps_max = boundedInteger(
      normalised.initial_wheel_steps_max,
      normalised.initial_wheel_steps_min,
      60,
      6
    );
    normalised.initial_max_parallel_cells = boundedInteger(
      normalised.initial_max_parallel_cells,
      1,
      100,
      28
    );`
    );
  }

  if (!result.includes("'initial_wheel_mode' must be 'short' or 'full'")) {
    result = result.replace(
      `    normalised.live_update_style = String(`,
      `    normalised.initial_wheel_mode = String(
      normalised.initial_wheel_mode || 'short'
    ).toLowerCase();
    if (!['short', 'full'].includes(normalised.initial_wheel_mode)) {
      throw new Error("split-flap-display-card: 'initial_wheel_mode' must be 'short' or 'full'.");
    }

    normalised.live_update_style = String(`
    );
  }

  return result;
});

update('examples/openpublictransport-departure-board.yaml', (source) => {
  let result = source
    .replace('initial_animation_style: direct', 'initial_animation_style: wheel')
    .replace('initial_start_spread: 420', 'initial_start_spread: 220');

  if (!result.includes('initial_wheel_mode: short')) {
    result = result.replace(
      `# Delay per column in wave mode.
initial_cell_stagger: 9`,
      `# Delay per column in wave mode.
initial_cell_stagger: 9

# short: shows only a small, varied run of intermediate characters.
# full: traverses the entire physical character wheel and flickers much more.
initial_wheel_mode: short

# Minimum and maximum number of intermediate wheel steps before the target.
initial_wheel_steps_min: 3
initial_wheel_steps_max: 6

# Maximum number of flap cells moving at the same time during startup.
# Limiting concurrency prevents the full board from becoming a dark flickering mosaic.
initial_max_parallel_cells: 28`
    );
  }

  return result;
});

update('README.md', (source) => {
  const section = `### Varied wheel startup

For a lively but readable airport-board effect, use the bounded short-wheel mode. Each cell shows only a few mechanically adjacent characters before its target, and the number of simultaneously moving cells is limited.

\`\`\`yaml
# Uses visible mechanical character changes.
initial_animation_style: wheel

# mixed: loose row order plus restrained per-cell variation.
initial_start_pattern: mixed

# Base offset between rows.
initial_row_stagger: 80

# Small additional start variation; avoid very large values such as 500+ ms.
initial_start_spread: 220

# short prevents the whole alphabet from flashing through every cell.
# full preserves the complete physical wheel for specialist demonstrations.
initial_wheel_mode: short

# Each cell shows three to six intermediate characters before settling.
initial_wheel_steps_min: 3
initial_wheel_steps_max: 6

# Limits simultaneous movement and removes the dark full-board flicker.
initial_max_parallel_cells: 28

# Duration of one visible wheel step.
step_duration: 50
\`\`\`

The short sequences remain deterministic for one replay and vary again on the next replay. Live sensor updates remain controlled separately by \`live_update_style\`.

`;

  return source.replace(
    /### Varied wheel startup[\s\S]*?### Live sensor updates/,
    `${section}### Live sensor updates`
  );
});
