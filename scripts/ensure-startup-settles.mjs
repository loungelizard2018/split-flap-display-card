import fs from 'node:fs';

const path = 'split-flap-display-card.js';
const source = fs.readFileSync(path, 'utf8');

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

if (!source.includes(oldBlock)) {
  if (source.includes('A startup animation is decorative and must never become a retry loop.')) {
    process.exit(0);
  }
  throw new Error('Could not find the startup retry block to replace.');
}

fs.writeFileSync(path, source.replace(oldBlock, newBlock));
