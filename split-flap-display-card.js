/**
 * Split Flap Display Card for Home Assistant
 * Version: 0.1.0
 */
import { configMethods } from './split-flap-config.js?v=0.1.0';
import { renderMethods } from './split-flap-render.js?v=0.1.0';
import { updateMethods } from './split-flap-update.js?v=0.1.0';
import { buildStyles } from './split-flap-styles.js?v=0.1.0';
import { escapeHtml, normaliseToken } from './split-flap-utils.js?v=0.1.0';

const VERSION = '0.1.0';

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
    this._fitAnimationFrame = null;
    this._windowResizeHandler = () => this._scheduleFit();
    this._resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => this._scheduleFit())
      : null;
  }

  static getStubConfig() {
    return {
      title: 'HOME STATUS',
      subtitle: 'ODENDORF',
      columns: 30,
      character_set: 'airport_de',
      max_parallel_cells: 1,
      rows: [
        {
          segments: [
            { type: 'datetime', entity: 'sensor.date_time_iso', format: 'HH:mm', width: 5 },
            { type: 'spacer', width: 1 },
            { type: 'text', value: 'SYSTEM READY', width: 16 },
            { type: 'spacer', width: 1 },
            { type: 'icon', icon: 'mdi:home-assistant', width: 1 },
          ],
        },
      ],
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
    return Math.max(1, this._config?.rows?.length || 1);
  }

  _renderToken(container, token) {
    const normalised = normaliseToken(token);
    if (normalised.type === 'icon') {
      container.innerHTML = `<ha-icon icon="${escapeHtml(normalised.value)}"></ha-icon>`;
    } else {
      container.textContent = normalised.value;
    }
  }

  _styles() {
    return buildStyles(this._config);
  }

  _cancelAnimations() {
    this._animationGeneration += 1;
    this._animationTimers.forEach((timer) => window.clearTimeout(timer));
    this._animationTimers.clear();
    this.shadowRoot?.querySelectorAll('.is-flipping').forEach((element) => element.classList.remove('is-flipping'));
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
    description: 'Photorealistic sequential split-flap instrument for Home Assistant.',
    preview: true,
    documentationURL: 'https://github.com/loungelizard2018/split-flap-display-card',
  });
}

console.info(
  `%c SPLIT-FLAP-DISPLAY-CARD %c v${VERSION} `,
  'color: white; background: #353535; font-weight: 700;',
  'color: #111; background: #d8d8cf;',
);
