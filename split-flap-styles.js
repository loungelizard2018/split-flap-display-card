export function buildStyles(config) {
  return String.raw`
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      overflow: hidden;
    }

    * { box-sizing: border-box; }

    ha-card {
      display: block;
      width: 100%;
      min-width: 0;
      overflow: hidden;
      padding: 12px;
    }

    ha-card.transparent {
      background: transparent;
      border: 0;
      box-shadow: none;
    }

    .card-shell {
      width: 100%;
      min-width: 0;
      overflow: hidden;
    }

    .instrument-stage {
      display: block;
      width: max-content;
      max-width: none;
      transform: scale(var(--fit-scale, 1));
      transform-origin: top left;
      will-change: transform;
    }

    .instrument {
      position: relative;
      display: inline-block;
      width: max-content;
      min-width: max-content;
      padding: 28px 50px 30px;
      border: 1px solid rgba(0, 0, 0, 0.98);
      border-radius: 10px;
      isolation: isolate;
      background-image:
        linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.005) 23%, rgba(0,0,0,0.12) 100%),
        repeating-linear-gradient(0deg, rgba(255,255,255,0.024) 0, rgba(255,255,255,0.024) 1px, rgba(0,0,0,0.03) 1px, rgba(0,0,0,0.03) 2px),
        linear-gradient(180deg, #262628 0%, #121214 26%, #050506 71%, #1b1b1d 100%);
      box-shadow:
        inset 0 0 0 1px rgba(255,255,255,0.10),
        inset 0 0 0 3px rgba(5,5,5,0.98),
        inset 0 0 0 4px rgba(172,172,172,0.78),
        inset 0 0 0 6px rgba(8,8,8,0.99),
        inset 0 -4px 8px rgba(0,0,0,0.72),
        0 8px 14px rgba(0,0,0,0.52),
        0 2px 3px rgba(0,0,0,0.72);
      filter:
        drop-shadow(0 8px 12px rgba(0,0,0,0.36))
        drop-shadow(0 1px 1px rgba(0,0,0,0.70));
    }

    .inner-bezel {
      position: absolute;
      z-index: 0;
      inset: 7px;
      border: 1px solid rgba(194,194,194,0.54);
      border-radius: 6px;
      box-shadow:
        0 1px 0 rgba(255,255,255,0.08),
        inset 0 1px 2px rgba(255,255,255,0.07),
        inset 0 -1px 2px rgba(0,0,0,0.74);
      pointer-events: none;
    }

    .display-panel {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .display-title,
    .display-subtitle {
      color: #e6e6df;
      font-family: "Helvetica Neue", Arial, sans-serif;
      text-transform: uppercase;
      text-shadow: 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(0,0,0,0.88);
    }

    .display-title {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 1.2px;
    }

    .display-subtitle {
      margin-top: -4px;
      font-size: 12px;
      font-weight: 400;
      letter-spacing: 0.9px;
      color: #bdbdb8;
    }

    .board {
      display: grid;
      gap: ${config.row_gap}px;
      width: max-content;
      padding: 7px 5px 3px;
      border: 2px solid rgba(4,4,4,0.98);
      border-radius: 5px;
      background: linear-gradient(180deg, #020202, #101010 48%, #030303);
      box-shadow:
        0 0 0 1px rgba(174,174,174,0.48),
        0 0 0 3px rgba(5,5,5,0.98),
        0 0 0 5px rgba(30,30,31,0.96),
        inset 0 8px 10px rgba(0,0,0,0.95),
        inset 0 -5px 8px rgba(0,0,0,0.88);
    }

    .flap-row {
      display: grid;
      grid-template-columns: repeat(${config.columns}, ${config.cell_width}px);
      gap: ${config.cell_gap}px;
      width: max-content;
    }

    .flap-cell {
      position: relative;
      width: ${config.cell_width}px;
      height: ${config.cell_height}px;
      perspective: 520px;
      contain: layout paint style;
    }

    .flap-cell-body {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      border: 1px solid rgba(0,0,0,0.96);
      border-radius: 3px;
      background: radial-gradient(ellipse at 50% 49%, #282828 0%, #111 46%, #030303 78%, #000 100%);
      box-shadow:
        inset 7px 0 11px rgba(0,0,0,0.70),
        inset -7px 0 11px rgba(0,0,0,0.68),
        inset 0 1px 0 rgba(255,255,255,0.08),
        inset 0 -2px 4px rgba(0,0,0,0.92),
        0 1px 1px rgba(255,255,255,0.05);
      transform-style: preserve-3d;
    }

    .cell-top,
    .cell-bottom,
    .flip-upper,
    .flip-lower {
      position: absolute;
      left: 0;
      width: 100%;
      height: 50%;
      overflow: hidden;
      backface-visibility: hidden;
      transform-style: preserve-3d;
    }

    .cell-top,
    .flip-upper {
      top: 0;
      transform-origin: center bottom;
    }

    .cell-bottom,
    .flip-lower {
      bottom: 0;
      transform-origin: center top;
    }

    .cell-top {
      background: linear-gradient(180deg, #222 0%, #151515 56%, #080808 100%);
      box-shadow: inset 0 -5px 8px rgba(0,0,0,0.52);
    }

    .cell-bottom {
      background: linear-gradient(180deg, #151515 0%, #0c0c0c 46%, #1d1d1d 100%);
      box-shadow: inset 0 5px 8px rgba(0,0,0,0.58);
    }

    .cell-content {
      position: absolute;
      left: 0;
      width: 100%;
      height: 200%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-bottom: 1px;
      color: #f2f1e9;
      font-family: "Arial Narrow", "Roboto Condensed", "Helvetica Neue", Arial, sans-serif;
      font-size: ${Math.round(config.cell_height * 0.68)}px;
      font-weight: 300;
      font-stretch: condensed;
      font-variant-numeric: tabular-nums;
      line-height: 1;
      letter-spacing: -1.5px;
      text-shadow:
        0 1px 0 rgba(255,255,255,0.28),
        0 2px 2px rgba(0,0,0,0.95),
        1px 0 0 rgba(0,0,0,0.82),
        -1px 0 0 rgba(0,0,0,0.82);
      user-select: none;
    }

    .cell-content ha-icon {
      --mdc-icon-size: ${Math.round(config.cell_height * 0.56)}px;
      color: #f2f1e9;
      filter: drop-shadow(0 2px 2px rgba(0,0,0,0.95));
    }

    .cell-top .cell-content,
    .flip-upper .cell-content { top: 0; }

    .cell-bottom .cell-content,
    .flip-lower .cell-content { top: -100%; }

    .cell-moving {
      z-index: 4;
      opacity: 0;
      pointer-events: none;
    }

    .flip-upper {
      background: linear-gradient(180deg, #242424 0%, #151515 55%, #050505 100%);
      box-shadow: inset 0 -5px 8px rgba(0,0,0,0.62);
      transform: rotateX(0deg);
    }

    .flip-lower {
      background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 50%, #202020 100%);
      box-shadow: inset 0 5px 8px rgba(0,0,0,0.64);
      transform: rotateX(90deg);
    }

    .is-flipping .flip-upper {
      opacity: 1;
      animation: flap-upper var(--flip-half-duration) cubic-bezier(.55,.06,.68,.19) forwards;
    }

    .is-flipping .flip-lower {
      opacity: 1;
      animation: flap-lower var(--flip-half-duration) cubic-bezier(.22,.61,.36,1) forwards;
      animation-delay: var(--flip-half-duration);
    }

    .flip-seam {
      position: absolute;
      z-index: 7;
      left: 0;
      right: 0;
      top: calc(50% - 1px);
      height: 2px;
      background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(0,0,0,0.88));
      box-shadow: 0 1px 0 rgba(255,255,255,0.035), 0 -1px 1px rgba(0,0,0,0.75);
      pointer-events: none;
    }

    .hinge {
      position: absolute;
      z-index: 8;
      top: calc(50% - 2px);
      width: 3px;
      height: 4px;
      border-radius: 1px;
      background: linear-gradient(180deg, #4a4a4a, #080808 70%);
      box-shadow: 0 0 1px rgba(0,0,0,0.9);
      pointer-events: none;
    }

    .hinge-left { left: 2px; }
    .hinge-right { right: 2px; }

    .cell-glass {
      position: absolute;
      z-index: 9;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      background:
        linear-gradient(112deg, rgba(255,255,255,0.085) 0%, rgba(255,255,255,0.012) 28%, transparent 48%, rgba(255,255,255,0.018) 72%, rgba(255,255,255,0.07) 100%);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.68);
    }

    @keyframes flap-upper {
      0% { transform: rotateX(0deg); filter: brightness(1); }
      72% { filter: brightness(.62); }
      100% { transform: rotateX(-90deg); filter: brightness(.32); }
    }

    @keyframes flap-lower {
      0% { transform: rotateX(90deg); filter: brightness(.38); }
      74% { filter: brightness(.9); }
      92% { transform: rotateX(-5deg); }
      100% { transform: rotateX(0deg); filter: brightness(1); }
    }

    .screw {
      position: absolute;
      z-index: 10;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      pointer-events: none;
      background:
        radial-gradient(circle at 32% 30%, rgba(255,255,255,.34) 0%, rgba(255,255,255,.10) 16%, rgba(255,255,255,0) 34%),
        radial-gradient(circle at 50% 48%, #4c4d50 0%, #2e3033 24%, #121314 58%, #020202 78%, #5a5c60 100%);
      box-shadow:
        inset 0 1px 1px rgba(255,255,255,.14),
        inset 0 -2px 4px rgba(0,0,0,.92),
        0 1px 2px rgba(0,0,0,.75);
    }

    .screw::before,
    .screw::after {
      content: "";
      position: absolute;
      left: 50%;
      top: 50%;
      width: 62%;
      height: 14%;
      border-radius: 999px;
      background: linear-gradient(180deg, #050505 0%, #393b3f 45%, #090909 100%);
      box-shadow: inset 0 1px 1px rgba(255,255,255,.10), 0 .5px 1px rgba(0,0,0,.65);
      transform: translate(-50%, -50%) rotate(var(--slot-rot, 0deg));
    }

    .screw::after {
      transform: translate(-50%, -50%) rotate(calc(var(--slot-rot, 0deg) + 90deg));
    }

    .screw-top-left { top: 9px; left: 9px; --slot-rot: -18deg; }
    .screw-top-right { top: 9px; right: 9px; --slot-rot: 12deg; }
    .screw-bottom-left { bottom: 9px; left: 9px; --slot-rot: 8deg; }
    .screw-bottom-right { bottom: 9px; right: 9px; --slot-rot: -12deg; }

    @media (max-width: 600px) {
      ha-card { padding: 8px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .is-flipping .flip-upper,
      .is-flipping .flip-lower { animation-duration: 1ms !important; animation-delay: 0ms !important; }
    }
  `;
}
