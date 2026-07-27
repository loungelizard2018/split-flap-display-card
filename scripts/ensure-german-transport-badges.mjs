import fs from 'node:fs';

function update(path, transform) {
  const source = fs.readFileSync(path, 'utf8');
  const changed = transform(source);
  if (changed !== source) fs.writeFileSync(path, changed);
}

update('split-flap-display-card.js', (source) => {
  let result = source;

  const importLine = "import { buildStyles } from './split-flap-styles.js?v=0.2.17';";
  const badgeImport = "import { buildTransportBadgeStyles, renderBuiltInTransportBadge } from './split-flap-transport-badges.js?v=0.2.17';";
  if (!result.includes('renderBuiltInTransportBadge')) {
    result = result.replace(importLine, `${importLine}\n${badgeImport}`);
  }

  const oldSpecialCase = `    if (normalised.type === 'icon' && normalised.value === 'splitflap:sbahn') {
      container.style.removeProperty('--glyph-color');
      container.innerHTML = '<span class="transport-badge transport-badge-sbahn" aria-label="S-Bahn">S</span>';
      return;
    }
`;
  const newSpecialCase = `    if (
      normalised.type === 'icon' &&
      renderBuiltInTransportBadge(container, normalised.value)
    ) {
      return;
    }
`;
  if (result.includes(oldSpecialCase)) {
    result = result.replace(oldSpecialCase, newSpecialCase);
  }

  if (!result.includes('buildTransportBadgeStyles(this._config.cell_height)')) {
    result = result.replace(
      '      .instrument.is-replayable {',
      '      ${buildTransportBadgeStyles(this._config.cell_height)}\n\n      .instrument.is-replayable {'
    );
  }

  return result;
});

update('split-flap-config.js', (source) => {
  const oldMap = `const DEFAULT_TRANSPORT_ICONS = Object.freeze({
  bus: 'mdi:bus',
  sbahn: 'splitflap:sbahn',
  train: 'mdi:train',
  regional: 'mdi:train',
  subway: 'mdi:subway-variant',
  tram: 'mdi:tram',
  ferry: 'mdi:ferry',
  unknown: 'mdi:transit-connection-variant',
});`;

  const newMap = `const DEFAULT_TRANSPORT_ICONS = Object.freeze({
  bus: 'mdi:bus',
  sbahn: 'splitflap:sbahn',
  ice: 'splitflap:ice',
  ic: 'splitflap:ic',
  train: 'mdi:train',
  regional: 'splitflap:regional',
  subway: 'splitflap:ubahn',
  tram: 'mdi:tram',
  ferry: 'mdi:ferry',
  unknown: 'mdi:transit-connection-variant',
});`;

  return source.includes(oldMap) ? source.replace(oldMap, newMap) : source;
});

update('split-flap-update.js', (source) => {
  let result = source;

  const oldIconResolution = `    const configuredIcon = this._config.transport_icon_map[transportMode] || this._config.transport_icon_map.unknown;
    const icon = transportMode === 'sbahn' && configuredIcon === 'mdi:alpha-s-circle'
      ? 'splitflap:sbahn'
      : configuredIcon;
    const platform = String(record?.platform || '').trim();`;

  const newIconResolution = `    const configuredIcon = this._config.transport_icon_map[transportMode] || this._config.transport_icon_map.unknown;
    const icon = this._transportBadgeToken(record, transportMode, configuredIcon);
    const platform = String(record?.platform || '').trim();`;

  if (result.includes(oldIconResolution)) {
    result = result.replace(oldIconResolution, newIconResolution);
  }

  if (!result.includes('_transportBadgeToken(record, transportMode, configuredIcon)')) {
    const marker = `  _transportMode(record) {`;
    const method = `  _transportBadgeToken(record, transportMode, configuredIcon) {
    const line = String(record?.line || '').trim().toUpperCase();
    const icon = String(configuredIcon || '');

    if (transportMode === 'sbahn' && icon === 'mdi:alpha-s-circle') {
      return 'splitflap:sbahn';
    }

    if (transportMode === 'ice' && icon === 'splitflap:ice') {
      const label = line.startsWith('ECE') ? 'ECE' : 'ICE';
      return \`splitflap:ice:\${label}\`;
    }

    if (transportMode === 'ic' && icon === 'splitflap:ic') {
      const label = line.startsWith('EC') ? 'EC' : 'IC';
      return \`splitflap:ic:\${label}\`;
    }

    if (transportMode === 'regional' && icon === 'splitflap:regional') {
      const match = line.match(/^(IRE|MEX|RE|RB|R)/);
      return \`splitflap:regional:\${match?.[1] || 'RE'}\`;
    }

    return icon;
  },

`;
    result = result.replace(marker, `${method}${marker}`);
  }

  result = result.replace(
    `    if (/^(RE|RB|R|IRE|MEX)\\s?\\d*/.test(line)) return 'regional';
    if (/^(ICE|IC|EC)\\s?\\d*/.test(line)) return 'train';`,
    `    if (/^(IRE|MEX|RE|RB|R)\\s?\\d*/.test(line)) return 'regional';
    if (/^(ICE|ECE)\\s?\\d*/.test(line)) return 'ice';
    if (/^(IC|EC)\\s?\\d*/.test(line)) return 'ic';`
  );

  return result;
});

for (const path of [
  'README.md',
  'examples/openpublictransport-departure-board.yaml',
]) {
  if (!fs.existsSync(path)) continue;
  update(path, (source) => {
    let result = source;

    if (!result.includes('ice: splitflap:ice')) {
      result = result.replace(
        '  # Generic train or long-distance rail symbol.\n  train: mdi:train',
        '  # Built-in German ICE-style badge.\n  ice: splitflap:ice\n\n  # Built-in German IC/EC-style badge.\n  ic: splitflap:ic\n\n  # Generic train symbol for unclassified rail services.\n  train: mdi:train'
      );
    }

    result = result.replace(
      /  # Regional rail symbol[^\n]*\n  regional: mdi:train/g,
      '  # Built-in RE/RB/IRE/MEX badge based on the line prefix.\n  regional: splitflap:regional'
    );
    result = result.replace(
      /  # Subway or underground symbol\.\n  subway: mdi:subway-variant/g,
      '  # Built-in blue German U-Bahn badge.\n  subway: splitflap:ubahn'
    );

    return result;
  });
}
