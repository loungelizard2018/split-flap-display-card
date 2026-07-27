/**
 * Split Flap Display Card for Home Assistant
 * Version: 0.2.11
 */
import { configMethods } from './split-flap-config.js?v=0.2.11';
import { renderMethods } from './split-flap-render.js?v=0.2.11';
import { updateMethods } from './split-flap-update.js?v=0.2.11';
import { buildStyles } from './split-flap-styles.js?v=0.2.11';
import {
  charToken,
  escapeHtml,
  normaliseToken,
  sleep,
  tokenSignature,
  tokensEqual,
} from './split-flap-utils.js?v=0.2.11';

const VERSION = '0.2.11';

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
      start_mode: 'simultaneous',
      cell_stagger: 90,
      animate_on_first_load: true,
      initial_animation_style: 'direct',
      initial_animation_delay: 450,
    };
  }

  setConfig(config) {
    this._cancelInitialAnimationTimer();
    this._config = this._normaliseConfig(config);
    this._initialRefreshQueued = false;
    this._hasPlayedInitialBuild = false;
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

    if (normalised.type === 'icon' && normalised.value === 'splitflap:sbahn') {
      container.style.removeProperty('--glyph-color');
      container.innerHTML = '<span class="transport-badge transport-badge-sbahn" aria-label="S-Bahn">S</span>';
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

      .instrument.is-replayable {
        cursor: pointer;
      }

      .instrument.is-replayable:focus-visible {
        outline: 2px solid var(--primary-color, #03a9f4);
        outline-offset: 4px;
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
    this._targetSignature = signature;
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

      if (groupIndex > 0 && this._config.cell_stagger > 0) {
        await sleep(this._config.cell_stagger);
      }

      const completed = await this._animateInitialRowReveal(
        groups[groupIndex],
        generation,
        buildRunId
      );
      if (!completed) return false;
    }

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
      records.map(({ refs }) =>
        this._flipCell(
          refs,
          fillToken,
          fillToken,
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

    await new Promise((resolve) => window.requestAnimationFrame(resolve));

    records.forEach(({ state, refs, desired, runId }) => {
      if (state.runId !== runId) return;
      state.current = desired;
      state.pending = null;
      state.busy = false;
      this._renderToken(refs.topStatic, desired);
      this._renderToken(refs.bottomStatic, desired);
    });

    return true;
  }

  async _runWheelInitialBuild() {
    this._updateBoard(false);
    return true;
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
          ? await this._runWheelInitialBuild()
          : await this._runDirectInitialBuild(buildRunId);
      } finally {
        if (buildRunId !== this._initialBuildRunId) return;

        this._initialAnimationPending = false;
        this._hasPlayedInitialBuild = completed;

        if (!completed && this.isConnected && this._rendered) {
          this._scheduleInitialBuild(120);
          return;
        }

        if (this._initialRefreshQueued) {
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
