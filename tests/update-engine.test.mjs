import test from 'node:test';
import assert from 'node:assert/strict';

import { updateMethods } from '../split-flap-update.js';
import { charToken, tokenSignature } from '../split-flap-utils.js';

function createBoard(rowCount = 2, columnCount = 3) {
  const board = {
    _hass: { states: {}, config: {} },
    _rendered: true,
    isConnected: true,
    _config: {
      display_mode: 'segments',
      rows: [],
      live_update_style: 'direct',
      live_row_stagger: 0,
      start_mode: 'simultaneous',
      cell_stagger: 0,
      max_parallel_cells: 1,
      flip_duration: 20,
      step_duration: 5,
      character_set: 'airport_de',
    },
    _cellStates: [],
    _cells: [],
    _targetSignature: '',
    _animationGeneration: 0,
    _animationTimers: new Set(),
    _activeFlips: new Set(),
    _liveUpdateRunning: false,
    _queuedLiveUpdate: null,
    _initialAnimationPending: false,
    _renderToken(container, token) {
      container.token = token;
    },
    _cancelAnimations() {
      this._animationGeneration += 1;
    },
    _updateHeading() {},
    _rowTokens(row) {
      return row;
    },
  };

  Object.assign(board, updateMethods);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    board._cellStates[rowIndex] = [];
    board._cells[rowIndex] = [];

    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      board._cellStates[rowIndex][columnIndex] = {
        current: charToken(' '),
        pending: null,
        busy: false,
        runId: 0,
      };
      board._cells[rowIndex][columnIndex] = {
        root: {},
        topStatic: {},
        bottomStatic: {},
        upperFlap: {},
        lowerFlap: {},
      };
    }
  }

  board._flipCell = async function flipCell(refs, fromToken, toToken) {
    await new Promise((resolve) => setTimeout(resolve, 2));
    this._renderToken(refs.topStatic, toToken);
    this._renderToken(refs.bottomStatic, toToken);
    return true;
  };

  return board;
}

function rows(...values) {
  return values.map((value) => [...value].map((character) => charToken(character)));
}

function displayed(board) {
  return board._cellStates.map((row) => row.map((state) => state.current.value).join(''));
}

test('direct transition commits every changed row to the same snapshot', async () => {
  const board = createBoard();
  const target = rows('ABC', 'DEF');
  const signature = tokenSignature(target);

  const completed = await board._runLiveTransition(target, signature, 'direct');

  assert.equal(completed, true);
  assert.deepEqual(displayed(board), ['ABC', 'DEF']);
  assert.equal(board._targetSignature, signature);
});

test('a newer sensor snapshot waits and replaces an older queued snapshot', async () => {
  const board = createBoard();
  const first = rows('ABC', 'DEF');
  const second = rows('GHI', 'JKL');
  const latest = rows('MNO', 'PQR');

  await board._runLiveTransition(first, tokenSignature(first), 'direct');

  board._queuedLiveUpdate = {
    rows: second,
    signature: tokenSignature(second),
  };

  const draining = board._drainLiveUpdates();

  setTimeout(() => {
    board._queuedLiveUpdate = {
      rows: latest,
      signature: tokenSignature(latest),
    };
  }, 1);

  await draining;
  await new Promise((resolve) => setTimeout(resolve, 20));

  assert.deepEqual(displayed(board), ['MNO', 'PQR']);
  assert.equal(board._targetSignature, tokenSignature(latest));
});
