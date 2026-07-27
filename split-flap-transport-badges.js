const BADGE_DEFAULTS = Object.freeze({
  sbahn: 'S',
  ubahn: 'U',
  ice: 'ICE',
  ic: 'IC',
  regional: 'RE',
});

const BADGE_LABELS = Object.freeze({
  sbahn: 'S-Bahn',
  ubahn: 'U-Bahn',
  ice: 'Intercity-Express',
  ic: 'Intercity',
  regional: 'Regional rail',
});

function safeBadgeLabel(value, fallback) {
  const cleaned = String(value || fallback)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 3);
  return cleaned || fallback;
}

export function renderBuiltInTransportBadge(container, tokenValue) {
  const value = String(tokenValue || '');
  if (!value.startsWith('splitflap:')) return false;

  const [, rawKind, ...labelParts] = value.split(':');
  const kind = String(rawKind || '').toLowerCase();
  if (!Object.hasOwn(BADGE_DEFAULTS, kind)) return false;

  const label = safeBadgeLabel(labelParts.join(':'), BADGE_DEFAULTS[kind]);
  const ariaLabel = BADGE_LABELS[kind];
  container.style.removeProperty('--glyph-color');

  if (kind === 'ice' || kind === 'ic') {
    container.innerHTML = `
      <span class="transport-badge transport-badge-${kind}" aria-label="${ariaLabel}">
        <span class="transport-badge-wordmark">${label}</span>
        <span class="transport-badge-redline" aria-hidden="true"></span>
      </span>
    `;
    return true;
  }

  container.innerHTML = `
    <span class="transport-badge transport-badge-${kind}" aria-label="${ariaLabel}">
      ${label}
    </span>
  `;
  return true;
}

export function buildTransportBadgeStyles(cellHeight) {
  const roundSize = Math.round(cellHeight * 0.55);
  const squareSize = Math.round(cellHeight * 0.54);
  const railWidth = Math.round(cellHeight * 0.62);
  const railHeight = Math.round(cellHeight * 0.42);

  return `
    .transport-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      flex: 0 0 auto;
      line-height: 1;
      font-family: Arial, Helvetica, sans-serif;
      text-shadow: none;
      transform: translateY(.5px);
      filter: saturate(.96) contrast(1.04);
    }

    .transport-badge-sbahn {
      width: ${roundSize}px;
      height: ${roundSize}px;
      border: ${Math.max(2, Math.round(cellHeight * 0.045))}px solid #fff;
      border-radius: 50%;
      background: #008a4b;
      color: #fff;
      font-size: ${Math.round(cellHeight * 0.34)}px;
      font-weight: 800;
      letter-spacing: -.8px;
      box-shadow:
        0 0 0 1px rgba(0,0,0,.75),
        inset 0 1px 1px rgba(255,255,255,.22),
        0 1px 2px rgba(0,0,0,.85);
    }

    .transport-badge-ubahn {
      width: ${squareSize}px;
      height: ${squareSize}px;
      border: 1px solid rgba(255,255,255,.92);
      border-radius: ${Math.max(2, Math.round(cellHeight * 0.055))}px;
      background: linear-gradient(180deg, #176eb5 0%, #005696 100%);
      color: #fff;
      font-size: ${Math.round(cellHeight * 0.34)}px;
      font-weight: 800;
      box-shadow:
        0 0 0 1px rgba(0,0,0,.75),
        inset 0 1px 1px rgba(255,255,255,.24),
        0 1px 2px rgba(0,0,0,.85);
    }

    .transport-badge-regional {
      min-width: ${squareSize}px;
      height: ${Math.round(cellHeight * 0.46)}px;
      padding: 0 ${Math.max(2, Math.round(cellHeight * 0.035))}px;
      border: 1px solid rgba(255,255,255,.78);
      border-radius: ${Math.max(2, Math.round(cellHeight * 0.05))}px;
      background: linear-gradient(180deg, #5b6470 0%, #353c45 100%);
      color: #fff;
      font-size: ${Math.round(cellHeight * 0.22)}px;
      font-weight: 800;
      letter-spacing: -.4px;
      box-shadow:
        0 0 0 1px rgba(0,0,0,.72),
        inset 3px 0 0 #ec0016,
        inset 0 1px 1px rgba(255,255,255,.15),
        0 1px 2px rgba(0,0,0,.82);
    }

    .transport-badge-ice,
    .transport-badge-ic {
      position: relative;
      width: ${railWidth}px;
      height: ${railHeight}px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.72);
      border-radius: ${Math.max(3, Math.round(cellHeight * 0.08))}px;
      background: linear-gradient(180deg, #fafafa 0%, #d9dcdf 100%);
      color: #4c5258;
      box-shadow:
        0 0 0 1px rgba(0,0,0,.78),
        inset 0 1px 1px rgba(255,255,255,.85),
        0 1px 2px rgba(0,0,0,.82);
    }

    .transport-badge-wordmark {
      position: relative;
      z-index: 1;
      display: inline-block;
      margin-top: -1px;
      font-size: ${Math.round(cellHeight * 0.19)}px;
      font-weight: 800;
      font-style: italic;
      letter-spacing: -1px;
      transform: scaleX(.94);
    }

    .transport-badge-redline {
      position: absolute;
      z-index: 0;
      left: 0;
      right: 0;
      bottom: ${Math.max(2, Math.round(cellHeight * 0.045))}px;
      height: ${Math.max(2, Math.round(cellHeight * 0.035))}px;
      background: #ec0016;
      box-shadow: 0 1px 0 rgba(255,255,255,.35);
    }
  `;
}
