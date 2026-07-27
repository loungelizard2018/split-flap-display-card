import fs from 'node:fs';

const runtimePath = 'split-flap-display-card.js';
let runtime = fs.readFileSync(runtimePath, 'utf8');

const oldBlock = `        this._initialAnimationPending = false;
        this._hasPlayedInitialBuild = completed;

        if (!completed && this.isConnected && this._rendered) {
          this._scheduleInitialBuild(120);
          return;
        }

        if (this._initialRefreshQueued) {
          this._initialRefreshQueued = false;
          this._updateBoard(false);
        }`;

const newBlock = `        this._initialAnimationPending = false;

        // A startup animation is decorative and must never become a retry loop.
        // If Home Assistant briefly detaches the card, a browser timer is delayed,
        // or one flap is cancelled, settle immediately on the latest complete
        // sensor snapshot instead of clearing the board and starting again.
        if (!completed && this.isConnected && this._rendered) {
          const fallbackRows = this._targetRowsForCurrentState();
          this._applyRowsImmediately(
            fallbackRows,
            tokenSignature(fallbackRows)
          );
          completed = true;
        }

        this._hasPlayedInitialBuild = completed;

        if (this._initialRefreshQueued && completed) {
          this._initialRefreshQueued = false;
          this._updateBoard(false);
        }`;

if (runtime.includes(oldBlock)) {
  runtime = runtime.replace(oldBlock, newBlock);
} else if (!runtime.includes('A startup animation is decorative and must never become a retry loop.')) {
  throw new Error('Could not find the startup retry block to replace.');
}

fs.writeFileSync(runtimePath, runtime);

const readmePath = 'README.md';
if (fs.existsSync(readmePath)) {
  let readme = fs.readFileSync(readmePath, 'utf8');
  const heading = '### Startup animation repeats instead of settling';

  if (!readme.includes(heading)) {
    const section = `${heading}

The startup build is deliberately one-shot. If a browser timer is interrupted or Home Assistant briefly reattaches the card, the animation stops retrying and the card settles immediately on the latest complete sensor snapshot. It will only run again after a page reload or an explicit click when \`replay_on_tap: true\`.

`;
    readme = readme.replace('## Troubleshooting\n', `## Troubleshooting\n\n${section}`);
    fs.writeFileSync(readmePath, readme);
  }
}
