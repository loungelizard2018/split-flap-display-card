import fs from 'node:fs';

const path = 'README.md';
let source = fs.readFileSync(path, 'utf8');

const demoSection = `## Real animation demo

![Real Split Flap Display Card animation in Home Assistant](docs/images/split-flap-display-demo.gif)

**[Play the higher-quality MP4 animation demo](docs/images/split-flap-display-demo.mp4)**

The recording was captured directly from Home Assistant. The first five seconds were removed. The embedded looping GIF is generated from the trimmed MP4 during the release workflow, while the linked MP4 provides the higher-quality version.

`;

source = source.replace(
  /## Real animation demo[\s\S]*?## Real Home Assistant screenshots\n/,
  `${demoSection}## Real Home Assistant screenshots\n`
);

const sizingSection = `## Dashboard sizing

Home Assistant Sections views divide each section into 12 columns. The card width and the internal instrument scale are controlled separately:

- \`grid_options.columns\` controls how much of the section the card occupies;
- \`fit_to_card\` allows the instrument to shrink to the available width;
- \`allow_upscale\` allows enlargement above the natural instrument size;
- \`max_fit_scale\` limits that enlargement;
- \`visible_rows\` controls the board height.

A balanced desktop size between half width and full width is:

\`\`\`yaml
# Occupies 9 of the 12 section columns.
grid_options:
  columns: 9

# Fits the complete instrument into those columns.
fit_to_card: true

# Allows moderate enlargement, but prevents an oversized full-screen board.
allow_upscale: true
max_fit_scale: 1.25

# Reduces vertical height independently of width.
visible_rows: 5
\`\`\`

Use \`columns: 6\` for half width, \`columns: 9\` for three-quarter width, and \`columns: 12\` or \`full\` for the complete section width. Avoid combining \`columns: full\` with a high \`max_fit_scale\` unless a wall-display-sized board is intended.

`;

if (!source.includes('## Dashboard sizing')) {
  source = source.replace(
    '## Recommended departure-board configuration\n',
    `${sizingSection}## Recommended departure-board configuration\n`
  );
} else {
  source = source.replace(
    /## Dashboard sizing[\s\S]*?## Recommended departure-board configuration\n/,
    `${sizingSection}## Recommended departure-board configuration\n`
  );
}

fs.writeFileSync(path, source);
