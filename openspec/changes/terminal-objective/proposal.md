# Proposal: Terminal Objective

## Why

Enemies need a target. The "Terminal" is the central object that the player must defend. Its destruction results in a Game Over.

## What Changes

We will implement:
- **Terminal Entity:** A stationary object in the center of the map.
- **Health System:** The Terminal has HP.
- **Lose Condition:** If Terminal HP <= 0, the game halts/ends.

## Capabilities

### Modified Capabilities
- `win-loss`: We already have a spec for this (`specs/win-loss`). We will implement the "Terminal Destruction" part of it.

### New Capabilities
- `defense-target`: The Terminal class and its state.

## Impact

- **New:** `src/game/terminal.js`
- **Modify:** `src/main.js` (Spawn it, render it, check HP).

## Success Criteria

- Terminal appears in the center of the map.
- Terminal has a health bar (visual or debug text).
- Manually damaging the terminal (debug command or self-damage test) triggers "Game Over".
