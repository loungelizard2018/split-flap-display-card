import fs from 'node:fs';

function update(path, transform) {
  const source = fs.readFileSync(path, 'utf8');
  const changed = transform(source);
  if (changed !== source) fs.writeFileSync(path, changed);
}

update('split-flap-performance.js', (source) => {
  let result = source;

  if (!result.includes("from './split-flap-flow-scheduler.js")) {
    result = result.replace(
      /(import \{ initialWheelSequence \} from '\.\/split-flap-wheel-start\.js\?v=[^']+';)/,
      `$1\nimport { runFlowingWheel } from './split-flap-flow-scheduler.js?v=0.2.24';`
    );
  }

  result = result.replaceAll('runRoundRobinWheel(this, jobs, generation, buildRunId)', 'runFlowingWheel(this, jobs, generation, buildRunId)');

  const startupCandidates = `    const candidates = [];
    targetRows.forEach((row, rowIndex) => {
      row.forEach((target, columnIndex) => {
        const state = this._cellStates[rowIndex]?.[columnIndex];
        if (!state) return;
        const desired = normaliseToken(target);
        if (!tokensEqual(state.current, desired)) candidates.push({ rowIndex, columnIndex, desired });
      });
    });`;

  const startupCandidatesWithOrdinal = `    const candidates = [];
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
    });`;

  if (result.includes(startupCandidates)) {
    result = result.replace(startupCandidates, startupCandidatesWithOrdinal);
  }

  const replayCandidates = `    const candidates = [];
    this._cellStates.forEach((row, rowIndex) => {
      row.forEach((state, columnIndex) => {
        const current = normaliseToken(state.current);
        if (current.type !== 'char' || current.value === ' ') return;
        candidates.push({ rowIndex, columnIndex, desired: current });
      });
    });`;

  const replayCandidatesWithOrdinal = `    const candidates = [];
    this._cellStates.forEach((row, rowIndex) => {
      let rowOrdinal = 0;
      row.forEach((state, columnIndex) => {
        const current = normaliseToken(state.current);
        if (current.type !== 'char' || current.value === ' ') return;
        candidates.push({ rowIndex, columnIndex, rowOrdinal, desired: current });
        rowOrdinal += 1;
      });
    });`;

  if (result.includes(replayCandidates)) {
    result = result.replace(replayCandidates, replayCandidatesWithOrdinal);
  }

  result = result.replaceAll(
    `          columnIndex: item.columnIndex,
          ordinal,`,
    `          columnIndex: item.columnIndex,
          rowOrdinal: item.rowOrdinal,
          ordinal,`
  );

  if (!result.includes('  rowOrdinal,\n  desired,')) {
    result = result.replace(
      `  rowIndex,
  columnIndex,
  desired,`,
      `  rowIndex,
  columnIndex,
  rowOrdinal,
  desired,`
    );
    result = result.replace(
      `    rowIndex,
    columnIndex,
    desired,`,
      `    rowIndex,
    columnIndex,
    rowOrdinal,
    desired,`
    );
  }

  return result;
});

update('split-flap-config.js', (source) => source
  .replace("initial_start_pattern: displayMode === 'departure_board' ? 'mixed' : 'wave'", "initial_start_pattern: displayMode === 'departure_board' ? 'mixed' : 'wave'")
  .replace('      initial_start_spread: 240,', '      initial_start_spread: 36,')
  .replace('      initial_cell_stagger: 9,', '      initial_cell_stagger: 6,')
  .replace('      initial_max_parallel_cells: 28,', '      initial_max_parallel_cells: 24,')
  .replace('      420\n    );', '      36\n    );')
  .replace('      9\n    );', '      6\n    );')
  .replace('      28\n    );', '      24\n    );'));

for (const path of [
  'examples/openpublictransport-departure-board.yaml',
  'examples/video-recording-demo.yaml',
]) {
  if (!fs.existsSync(path)) continue;
  update(path, (source) => source
    .replace(/initial_row_stagger: \d+/g, 'initial_row_stagger: 55')
    .replace(/initial_start_spread: \d+/g, 'initial_start_spread: 36')
    .replace(/initial_cell_stagger: \d+/g, 'initial_cell_stagger: 6')
    .replace(/initial_wheel_steps_min: \d+/g, 'initial_wheel_steps_min: 2')
    .replace(/initial_wheel_steps_max: \d+/g, 'initial_wheel_steps_max: 4')
    .replace(/initial_max_parallel_cells: \d+/g, 'initial_max_parallel_cells: 24'));
}

update('README.md', (source) => {
  let result = source
    .replace(/initial_row_stagger: \d+/g, 'initial_row_stagger: 55')
    .replace(/initial_start_spread: \d+/g, 'initial_start_spread: 36')
    .replace(/initial_cell_stagger: \d+/g, 'initial_cell_stagger: 6')
    .replace(/initial_wheel_steps_min: \d+/g, 'initial_wheel_steps_min: 2')
    .replace(/initial_wheel_steps_max: \d+/g, 'initial_wheel_steps_max: 4')
    .replace(/initial_max_parallel_cells: \d+/g, 'initial_max_parallel_cells: 24');

  const marker = '## Animation model\n';
  const note = `## Smooth startup flow

The default \`mixed\` startup is a continuous compact wave. Timing follows populated cells rather than absolute board columns, so spaces between TIME, LINE and DESTINATION do not leave visible holes. Once a cell starts, it completes its short wheel sequence before its animation slot is reused; this prevents scattered half-finished letters.

Recommended departure-board settings:

\`\`\`yaml
initial_animation_style: wheel
initial_start_pattern: mixed
initial_row_stagger: 55
initial_cell_stagger: 6
initial_start_spread: 36
initial_wheel_mode: short
initial_wheel_steps_min: 2
initial_wheel_steps_max: 4
initial_max_parallel_cells: 24
step_duration: 52
\`\`\`

`;

  if (!result.includes('## Smooth startup flow')) {
    result = result.replace(marker, `${note}${marker}`);
  }
  return result;
});
