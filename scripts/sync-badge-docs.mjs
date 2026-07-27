import fs from 'node:fs';

const path = 'README.md';
let source = fs.readFileSync(path, 'utf8');

const mapping = `# Transport-mode icon mapping.
transport_icon_map:
  # Standard bus symbol.
  bus: mdi:bus

  # Built-in green German S-Bahn badge.
  sbahn: splitflap:sbahn

  # Built-in ICE/ECE badge with a light body and red stripe.
  ice: splitflap:ice

  # Built-in IC/EC badge with a light body and red stripe.
  ic: splitflap:ic

  # Generic train symbol for unclassified rail services.
  train: mdi:train

  # Built-in RE/RB/IRE/MEX badge; the line prefix is selected automatically.
  regional: splitflap:regional

  # Built-in blue German U-Bahn badge.
  subway: splitflap:ubahn

  # Tram or streetcar.
  tram: mdi:tram

  # Ferry.
  ferry: mdi:ferry

  # Fallback for unknown modes.
  unknown: mdi:transit-connection-variant`;

source = source.replace(
  /# Transport-mode icon mapping\.\ntransport_icon_map:\n[\s\S]*?  unknown: mdi:transit-connection-variant/,
  mapping
);

source = source
  .replace('| `ICE`, `IC`, `EC` | Train |', '| `ICE`, `ECE` | ICE/ECE badge |\n| `IC`, `EC` | IC/EC badge |')
  .replace('| `U2` | Subway |', '| `U2` | German U-Bahn badge |')
  .replace('| `RE1`, `RB48`, `IRE`, `MEX` | Regional rail |', '| `RE1`, `RB48`, `IRE`, `MEX` | Prefix-specific regional badge |');

if (!source.includes('### Built-in German transport badges')) {
  const marker = '## Animation model\n';
  const section = `## Transport badges

### Built-in German transport badges

The departure-board mode can render local vector/CSS badges without external image requests:

- green circular **S** for S-Bahn;
- blue square **U** for U-Bahn;
- light **ICE/ECE** and **IC/EC** wordmarks with a red lower stripe;
- compact **RE**, **RB**, **IRE** or **MEX** regional badges selected from the line prefix.

These are original card renderings inspired by familiar German transport signage. They are not official operator logo files.

`;
  source = source.replace(marker, `${section}${marker}`);
}

fs.writeFileSync(path, source);
