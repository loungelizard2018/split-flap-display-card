# Changelog

## 0.2.24

- Replaced forced-layout and timer-driven flips with compositor Web Animations.
- Added round-robin wheel scheduling for continuous large-board motion.
- Made replay non-destructive; the populated board is no longer blanked.
- Kept unchanged cells and transport badges visible during replay.
- Added adaptive parallelism and wheel-step limits for large boards.

