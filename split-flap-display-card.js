/**
 * Split Flap Display Card for Home Assistant
 * Version: 0.2.31
 */
import { configMethods } from './split-flap-config.js?v=0.2.31';
import { renderMethods } from './split-flap-render.js?v=0.2.31';
import { updateMethods } from './split-flap-update.js?v=0.2.31';
import { performanceAnimationMethods } from './split-flap-performance.js?v=0.2.31';
import { buildStyles } from './split-flap-styles.js?v=0.2.31';
import { buildTransportBadgeStyles, renderBuiltInTransportBadge } from './split-flap-transport-badges.js?v=0.2.31';
import { initialStartDelay } from './split-flap-start-patterns.js?v=0.2.31';
import { createConcurrencyGate, initialWheelSequence } from './split-flap-wheel-start.js?v=0.2.31';
import {
  CHARSETS,
  charToken,
  escapeHtml,
  normaliseToken,
  sleep,
  tokenSignature,
  tokensEqual,
} from './split-flap-utils.js?v=0.2.31';

const VERSION = '0.2.31';

class SplitFlapDisplayCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = null;
    this._hass = null;
    this._rendered = false;
    this._cells = [];
    this._cellStates = [];
    this._targetSignature = '';
    this._animationGeneration = 0;
    this._animationTimers = new Set();
    this._activeFlips = new Set();
    this._fitAnimationFrame = null;

    this._initialAnimationTimer = null;
    this._initialAnimationPending = false;
    this._initialRefreshQueued = false;
    this._initialBuildRunId = 0;
    this._hasPlayedInitialBuild = false;
    this._initialVariationSeed = 0;

    this._liveUpdateRunning = false;
    this._queuedLiveUpdate = null;

    this._windowResizeHandler = () => this._scheduleFit();
    this._replayClickHandler = () => this._replayInitialAnimation();
    this._replayKeyHandler = (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      this._replayInitialAnimation();
    };
    this._resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => this._scheduleFit())
      : null;
  }

  static getStubConfig() {
    return {
      display_mode: 'departure_board',
      entity: 'sensor.central_station_departures',
      departure_attribute: 'departures',
      title: 'DEPARTURES',
      visible_rows: 5,
      animate_on_first_load: true,
      initial_animation_style: 'direct',
      initial_animation_delay: 450,
      initial_flip_duration: 220,
      initial_row_stagger: 120,
      initial_start_pattern: 'mixed',
      initial_start_spread: 420,
      initial_cell_stagger: 9,
      live_update_style: 'direct',
      live_row_stagger: 0,
      start_mode: 'simultaneous',
      cell_stagger: 4,
    };
  }

  setConfig(config) {
    this._cancelInitialAnimationTimer();
    this._cancelAnimations();
    this._config = this._normaliseConfig(config);
    this._initialRefreshQueued = false;
    this._hasPlayedInitialBuild = false;
    this._liveUpdateRunning = false;
    this._queuedLiveUpdate = null;
    this._rendered = false;
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;

    if (!this._rendered) {
      this._render();
      return;
    }

    if (this._initialAnimationPending) {
      this._initialRefreshQueued = true;
      this._updateHeading();
      return;
    }

    this._updateBoard();
  }

  connectedCallback() {
    window.addEventListener('resize', this._windowResizeHandler, { passive: true });
    this._scheduleFit();

    if (
      this._rendered &&
      this._config?.animate_on_first_load &&
      !this._hasPlayedInitialBuild &&
      !this._initialAnimationPending
    ) {
      this._scheduleInitialBuild(this._config.initial_animation_delay);
    }
  }

  disconnectedCallback() {
    const buildWasPending = this._initialAnimationPending;
    this._cancelInitialAnimationTimer();
    this._cancelAnimations();
    this._liveUpdateRunning = false;
    this._queuedLiveUpdate = null;
    if (buildWasPending) this._hasPlayedInitialBuild = false;

    this._resizeObserver?.disconnect();
    window.removeEventListener('resize', this._windowResizeHandler);
    if (this._fitAnimationFrame !== null) {
      window.cancelAnimationFrame(this._fitAnimationFrame);
      this._fitAnimationFrame = null;
    }
  }

  getCardSize() {
    if (this._config?.display_mode === 'departure_board') {
      return Math.max(2, this._config.visible_rows + 1);
    }
    return Math.max(1, this._config?.rows?.length || 1);
  }

  _renderToken(container, token) {
    const normalised = normaliseToken(token);

    if (
      normalised.type === 'icon' &&
      renderBuiltInTransportBadge(container, normalised.value)
    ) {
      return;
    }

    if (normalised.color) container.style.setProperty('--glyph-color', normalised.color);
    else container.style.removeProperty('--glyph-color');

    if (normalised.type === 'icon') {
      container.innerHTML = `<ha-icon icon="${escapeHtml(normalised.value)}"></ha-icon>`;
    } else {
      container.textContent = normalised.value;
    }
  }

  _styles() {
    return `${buildStyles(this._config)}
      .transport-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        line-height: 1;
        font-family: Arial, Helvetica, sans-serif;
        transform: translateY(0.5px);
      }

      .transport-badge-sbahn {
        width: ${Math.round(this._config.cell_height * 0.54)}px;
        height: ${Math.round(this._config.cell_height * 0.54)}px;
        border: ${Math.max(2, Math.round(this._config.cell_height * 0.045))}px solid #ffffff;
        border-radius: 50%;
        background: #008a4b;
        color: #ffffff;
        font-size: ${Math.round(this._config.cell_height * 0.34)}px;
        font-weight: 800;
        letter-spacing: -0.8px;
        text-shadow: none;
        box-shadow:
          0 0 0 1px rgba(0,0,0,.75),
          inset 0 1px 1px rgba(255,255,255,.22),
          0 1px 2px rgba(0,0,0,.85);
      }

      ${buildTransportBadgeStyles(this._config.cell_height)}

      .instrument.is-replayable {
        cursor: pointer;
      }

      .instrument.is-replayable:focus-visible {
        outline: 2px solid var(--primary-color, #03a9f4);
        outline-offset: 4px;
      }

      /*
       * Home Assistant and the operating system may expose
       * prefers-reduced-motion even when this instrument was explicitly
       * configured for a demonstration. The base stylesheet previously
       * reduced the two flap halves to 1 ms while the JavaScript timers still
       * waited for the configured duration. That looked like a static row
       * appearing after a pause. These later rules keep the physical flap
       * duration in sync with the configured timing.
       */
      .flap-cell.is-flipping .flip-upper {
        animation-duration: var(--flip-half-duration) !important;
      }

      .flap-cell.is-flipping .flip-lower {
        animation-duration: var(--flip-half-duration) !important;
        animation-delay: var(--flip-half-duration) !important;
      }

      .flap-cell.is-flipping .flap-cell-body {
        animation: split-flap-impact
          calc(var(--flip-half-duration) + var(--flip-half-duration))
          cubic-bezier(.22,.61,.36,1) both;
      }

      .flap-cell.is-flipping .flip-upper {
        box-shadow:
          inset 0 -8px 12px rgba(0,0,0,.78),
          0 5px 9px rgba(0,0,0,.72);
      }

      .flap-cell.is-flipping .flip-lower {
        box-shadow:
          inset 0 7px 11px rgba(0,0,0,.72),
          0 -3px 7px rgba(255,255,255,.07);
      }

      @keyframes split-flap-impact {
        0% {
          filter: brightness(1);
          transform: translateY(0);
        }
        42% {
          filter: brightness(.58);
          transform: translateY(.45px);
        }
        58% {
          filter: brightness(1.18);
          transform: translateY(-.25px);
        }
        100% {
          filter: brightness(1);
          transform: translateY(0);
        }
      }
    `;
  }

  _cancelInitialAnimationTimer() {
    this._initialBuildRunId += 1;
    if (this._initialAnimationTimer !== null) {
      window.clearTimeout(this._initialAnimationTimer);
      this._initialAnimationTimer = null;
    }
    this._initialAnimationPending = false;
  }

  _targetRowsForCurrentState() {
    return this._config.display_mode === 'departure_board'
      ? this._departureRows()
      : this._config.rows.map((row) => this._rowTokens(row));
  }

  _primeBoardWithFillCharacter() {
    this._cancelAnimations();
    this._liveUpdateRunning = false;
    this._queuedLiveUpdate = null;

    const fillToken = charToken(this._config.initial_fill_char || ' ');
    this._targetSignature = '';

    this._cellStates.forEach((row, rowIndex) => {
      row.forEach((state, columnIndex) => {
        const refs = this._cells[rowIndex]?.[columnIndex];
        state.current = charToken(fillToken.value);
        state.pending = null;
        state.busy = false;
        state.runId = (state.runId || 0) + 1;
        if (!refs) return;
        refs.root.classList.remove('is-flipping');
        this._renderToken(refs.topStatic, state.current);
        this._renderToken(refs.bottomStatic, state.current);
      });
    });

    this._updateHeading();
  }

  async _runDirectInitialBuild(buildRunId) {
    if (!this._rendered || !this._hass || !this.isConnected) return false;

    this._updateHeading();
    const targetRows = this._targetRowsForCurrentState();
    const signature = tokenSignature(targetRows);

    this._cancelAnimations();
    const generation = this._animationGeneration;
    const rowChanges = new Map();

    targetRows.forEach((row, rowIndex) => {
      row.forEach((target, columnIndex) => {
        const state = this._cellStates[rowIndex]?.[columnIndex];
        if (!state) return;
        const desired = normaliseToken(target);
        if (!tokensEqual(state.current, desired)) {
          if (!rowChanges.has(rowIndex)) rowChanges.set(rowIndex, []);
          rowChanges.get(rowIndex).push({ rowIndex, columnIndex, desired });
        }
      });
    });

    const groups = [...rowChanges.entries()]
      .sort(([leftRow], [rightRow]) => leftRow - rightRow)
      .map(([, items]) => items);

    for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
      if (
        buildRunId !== this._initialBuildRunId ||
        generation !== this._animationGeneration ||
        !this.isConnected
      ) {
        return false;
      }

      if (groupIndex > 0 && this._config.initial_row_stagger > 0) {
        await sleep(this._config.initial_row_stagger);
      }

      const completed = await this._animateInitialRowReveal(
        groups[groupIndex],
        generation,
        buildRunId
      );
      if (!completed) return false;
    }

    this._targetSignature = signature;
    return true;
  }

  async _animateInitialRowReveal(items, generation, buildRunId) {
    const fillToken = charToken(this._config.initial_fill_char || ' ');
    const records = items.map((item) => {
      const state = this._cellStates[item.rowIndex]?.[item.columnIndex];
      const refs = this._cells[item.rowIndex]?.[item.columnIndex];
      if (!state || !refs) return null;

      const runId = (state.runId || 0) + 1;
      state.runId = runId;
      state.busy = true;
      state.pending = null;
      return { ...item, state, refs, runId };
    }).filter(Boolean);

    if (records.length === 0) return true;

    const results = await Promise.all(
      records.map(({ refs, desired }) =>
        this._flipCell(
          refs,
          fillToken,
          desired,
          this._config.initial_flip_duration
        )
      )
    );

    const valid = results.every(Boolean) &&
      buildRunId === this._initialBuildRunId &&
      generation === this._animationGeneration &&
      this.isConnected &&
      records.every(({ state, runId }) => state.runId === runId);

    if (!valid) {
      records.forEach(({ state, runId }) => {
        if (state.runId === runId) state.busy = false;
      });
      return false;
    }

    records.forEach(({ state, desired, runId }) => {
      if (state.runId !== runId) return;
      state.current = desired;
      state.pending = null;
      state.busy = false;
    });

    return true;
  }

  async _runWheelInitialBuild(buildRunId) {
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

  _scheduleInitialBuild(delay = this._config.initial_animation_delay) {
    if (!this._rendered || !this._hass) return;

    this._cancelInitialAnimationTimer();
    const buildRunId = this._initialBuildRunId;
    this._primeBoardWithFillCharacter();
    this._initialRefreshQueued = false;
    this._initialAnimationPending = true;
    this._hasPlayedInitialBuild = false;

    const timer = window.setTimeout(async () => {
      if (
        this._initialAnimationTimer !== timer ||
        buildRunId !== this._initialBuildRunId
      ) {
        return;
      }

      this._initialAnimationTimer = null;
      let completed = false;

      try {
        completed = this._config.initial_animation_style === 'wheel'
          ? await this._runWheelInitialBuild(buildRunId)
          : await this._runDirectInitialBuild(buildRunId);
      } finally {
        if (buildRunId !== this._initialBuildRunId) return;

        this._initialAnimationPending = false;

        // A startup animation is decorative and must never become a retry loop.
        // If Home Assistant briefly detaches the card, a browser timer is delayed,
        // or one flap is cancelled, settle immediately on the latest complete
        // sensor snapshot instead of clearing the board and starting again.
        if (!completed && this.isConnected && this._rendered) {
          const fallbackRows = this._targetRowsForCurrentState();
          this._applyRowsImmediately(
            fallbackRows,
            tokenSignature(fallbackRows)
          );
          completed = true;
        }

        this._hasPlayedInitialBuild = completed;

        if (this._initialRefreshQueued && completed) {
          this._initialRefreshQueued = false;
          this._updateBoard(false);
        }
      }
    }, delay);

    this._initialAnimationTimer = timer;
  }

  _replayInitialAnimation() {
    if (!this._config?.replay_on_tap || !this._rendered || !this._hass) return;
    this._hasPlayedInitialBuild = false;
    this._scheduleInitialBuild(this._config.initial_animation_delay);
  }

  _cancelAnimations() {
    this._animationGeneration += 1;

    [...this._activeFlips].forEach((cancel) => cancel());
    this._activeFlips.clear();

    this._animationTimers.forEach((timer) => window.clearTimeout(timer));
    this._animationTimers.clear();

    this._cellStates.forEach((row, rowIndex) => {
      row.forEach((state, columnIndex) => {
        state.runId = (state.runId || 0) + 1;
        state.busy = false;
        state.pending = null;

        const refs = this._cells[rowIndex]?.[columnIndex];
        if (!refs) return;
        refs.root.classList.remove('is-flipping');
        this._renderToken(refs.topStatic, state.current);
        this._renderToken(refs.bottomStatic, state.current);
      });
    });
  }

  _scheduleFit() {
    if (!this._rendered) return;
    if (this._fitAnimationFrame !== null) window.cancelAnimationFrame(this._fitAnimationFrame);

    this._fitAnimationFrame = window.requestAnimationFrame(() => {
      this._fitAnimationFrame = null;
      const shell = this.shadowRoot.querySelector('.card-shell');
      const stage = this.shadowRoot.querySelector('.instrument-stage');
      const instrument = this.shadowRoot.querySelector('.instrument');
      if (!shell || !stage || !instrument) return;

      const availableWidth = shell.clientWidth;
      const naturalWidth = instrument.offsetWidth;
      const naturalHeight = instrument.offsetHeight;
      if (availableWidth <= 0 || naturalWidth <= 0 || naturalHeight <= 0) return;

      let fitScale = 1;
      if (this._config.fit_to_card) {
        const widthRatio = availableWidth / naturalWidth;
        fitScale = this._config.allow_upscale
          ? Math.min(this._config.max_fit_scale, widthRatio)
          : Math.min(1, widthRatio);
        fitScale = Math.max(0.05, fitScale);
      }

      const roundedScale = Number(fitScale.toFixed(5));
      stage.style.setProperty('--fit-scale', String(roundedScale));
      stage.style.height = `${Math.ceil(naturalHeight * roundedScale)}px`;
    });
  }
}

Object.assign(
  SplitFlapDisplayCard.prototype,
  configMethods,
  renderMethods,
  updateMethods,
  performanceAnimationMethods,
);

if (!customElements.get('split-flap-display-card')) {
  customElements.define('split-flap-display-card', SplitFlapDisplayCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === 'split-flap-display-card')) {
  window.customCards.push({
    type: 'split-flap-display-card',
    name: 'Split Flap Display',
    description: 'Photorealistic split-flap instrument and live public-transport departure board.',
    preview: true,
    documentationURL: 'https://github.com/loungelizard2018/split-flap-display-card',
  });
}

console.info(
  `%c SPLIT-FLAP-DISPLAY-CARD %c v${VERSION} `,
  'color: white; background: #353535; font-weight: 700;',
  'color: #111; background: #d8d8cf;',
);
