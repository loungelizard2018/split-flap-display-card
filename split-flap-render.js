import { charToken, escapeHtml } from './split-flap-utils.js?v=0.1.0';

export const renderMethods = {
  _render() {
    this._resizeObserver?.disconnect();
    this._cancelAnimations();

    const config = this._config;
    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <ha-card class="${config.transparent_card ? 'transparent' : ''}">
        <div class="card-shell">
          <div class="instrument-stage">
            <section class="instrument frame-gauge-black ${config.screws ? 'with-screws' : ''}">
              ${config.screws ? this._renderScrews() : ''}
              <div class="inner-bezel" aria-hidden="true"></div>
              <div class="display-panel">
                ${config.title ? `<div class="display-title">${escapeHtml(config.title)}</div>` : ''}
                ${config.subtitle ? `<div class="display-subtitle">${escapeHtml(config.subtitle)}</div>` : ''}
                <div class="board" id="board" aria-live="polite"></div>
              </div>
            </section>
          </div>
        </div>
      </ha-card>
    `;

    const board = this.shadowRoot.getElementById('board');
    this._cells = [];
    this._cellStates = [];

    config.rows.forEach((row, rowIndex) => {
      const rowElement = document.createElement('div');
      rowElement.className = 'flap-row';
      rowElement.dataset.rowIndex = String(rowIndex);
      rowElement.setAttribute('role', 'group');
      board.appendChild(rowElement);

      this._cells[rowIndex] = [];
      this._cellStates[rowIndex] = [];

      for (let column = 0; column < config.columns; column += 1) {
        const cellElement = document.createElement('div');
        cellElement.className = 'flap-cell';
        cellElement.dataset.rowIndex = String(rowIndex);
        cellElement.dataset.columnIndex = String(column);
        cellElement.innerHTML = `
          <div class="flap-cell-body">
            <div class="cell-top cell-static"><div class="cell-content"></div></div>
            <div class="cell-bottom cell-static"><div class="cell-content"></div></div>
            <div class="flip-upper cell-moving"><div class="cell-content"></div></div>
            <div class="flip-lower cell-moving"><div class="cell-content"></div></div>
            <div class="flip-seam" aria-hidden="true"></div>
            <div class="hinge hinge-left" aria-hidden="true"></div>
            <div class="hinge hinge-right" aria-hidden="true"></div>
            <div class="cell-glass" aria-hidden="true"></div>
          </div>
        `;
        rowElement.appendChild(cellElement);

        const refs = {
          root: cellElement,
          topStatic: cellElement.querySelector('.cell-top .cell-content'),
          bottomStatic: cellElement.querySelector('.cell-bottom .cell-content'),
          upperFlap: cellElement.querySelector('.flip-upper .cell-content'),
          lowerFlap: cellElement.querySelector('.flip-lower .cell-content'),
        };

        this._cells[rowIndex][column] = refs;
        this._cellStates[rowIndex][column] = {
          current: charToken(' '),
          pending: null,
          busy: false,
        };
        this._renderToken(refs.topStatic, charToken(' '));
        this._renderToken(refs.bottomStatic, charToken(' '));
      }
    });

    const stage = this.shadowRoot.querySelector('.instrument-stage');
    if (stage && this._resizeObserver) this._resizeObserver.observe(stage);

    this._rendered = true;
    this._targetSignature = '';
    this._updateBoard(true);
    this._scheduleFit();
  },

  _renderScrews() {
    return `
      <div class="screw screw-top-left" aria-hidden="true"></div>
      <div class="screw screw-top-right" aria-hidden="true"></div>
      <div class="screw screw-bottom-left" aria-hidden="true"></div>
      <div class="screw screw-bottom-right" aria-hidden="true"></div>
    `;
  },
};
