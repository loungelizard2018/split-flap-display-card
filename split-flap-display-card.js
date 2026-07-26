/**
 * Split Flap Display Card for Home Assistant
 * Version: 0.2.2
 */
import { configMethods } from './split-flap-config.js?v=0.2.2';
import { renderMethods } from './split-flap-render.js?v=0.2.2';
import { updateMethods } from './split-flap-update.js?v=0.2.2';
import { buildStyles } from './split-flap-styles.js?v=0.2.2';
import { escapeHtml, normaliseToken } from './split-flap-utils.js?v=0.2.2';

const VERSION = '0.2.2';

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
    this._windowResizeHandler = () => this._scheduleFit();
    this._resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => this._scheduleFit())
      : null;
  }

  static getStubConfig() {
    return {
      display_mode: 'departure_board',
      entity: 'sensor.swisttal_odendorf_bf_nahreisezug_swisttal_odendorf_bf',
      departure_attribute: 'departures',
      title: 'DEPARTURES',
      visible_rows: 8,
      start_mode: 'simultaneous',
      cell_stagger: 14,
    };
  }

  setConfig(config) {
    this._config = this._normaliseConfig(config);
    this._rendered = false;
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    if (!this._rendered) this._render();
    else this._updateBoard();
  }

  connectedCallback() {
    window.addEventListener('resize', this._windowResizeHandler, { passive: true });
    this._scheduleFit();
  }

  disconnectedCallback() {
    this._cancelAnimations();
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
    `;
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