import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

function updateFile(path, transform) {
  const current = fs.readFileSync(path, 'utf8');
  const updated = transform(current);
  if (updated !== current) fs.writeFileSync(path, updated);
}

updateFile('split-flap-display-card.js', (source) => source
  .replace(/Version: \d+\.\d+\.\d+/, `Version: ${version}`)
  .replaceAll(/\?v=\d+\.\d+\.\d+/g, `?v=${version}`)
  .replace(/const VERSION = '\d+\.\d+\.\d+';/, `const VERSION = '${version}';`));

for (const path of [
  'split-flap-config.js',
  'split-flap-render.js',
  'split-flap-update.js',
]) {
  updateFile(path, (source) =>
    source.replaceAll(/\?v=\d+\.\d+\.\d+/g, `?v=${version}`));
}

if (fs.existsSync('README.md')) {
  updateFile('README.md', (source) => source
    .replace(/\*\*Current release: v\d+\.\d+\.\d+\*\*/, `**Current release: v${version}**`)
    .replace(/Select release \*\*v\d+\.\d+\.\d+\*\*/, `Select release **v${version}**`)
    .replace(/SPLIT-FLAP-DISPLAY-CARD v\d+\.\d+\.\d+/, `SPLIT-FLAP-DISPLAY-CARD v${version}`));
}
