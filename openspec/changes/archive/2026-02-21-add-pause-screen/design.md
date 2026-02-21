# Design: Add Pause Screen

## Context
Currently, the prototype loops continuously without any capability to suspend logic temporarily. To give the player a chance to breathe, we need a standard PAUSED gameplay state. This state must gracefully suspend logical simulation of enemies, towers, encounters, and projectiles while visually maintaining the current scene underneath an interface overlay.

## Goals / Non-Goals
**Goals:**
- Implement a `PAUSED` enum value in `GameState.js`.
- Add a new `PauseScreen` class to the existing UIManager hierarchy.
- Use `ESC` character to freely toggle between `PLAYING` and `PAUSED`.
- Freeze all game simulation (`update` loop segments) when `PAUSED`.

**Non-Goals:**
- Creating a fully-functional Pause Menu with "Settings", "Return to Menu", etc. (We are only adding the structural foundation and a basic "PAUSED" text indicator for now).
- Pausing or halting the requestAnimationFrame (`GameLoop.js`) entirely. We want it to continue triggering the `draw()` loop to render the scene statically beneath the UI.

## Decisions
1. **State Addition & `Game.js` Update Hook:**
   - We will introduce `GameState.PAUSED`.
   - In `Game.js`, instead of completely stopping `GameLoop`, we will add `if (this.gameState === GameState.PAUSED) return;` at the beginning of `update(dt)`. This ensures that all components (movement vector fetches, firing logic, encountering spawns) will not execute. 
   - `draw()` will continue executing, rendering the frozen game world accurately, and then `UIManager` will draw the DOM-based `PauseScreen` layer on top.

2. **Input Interception:**
   - `Game.js` currently defines a monolithic keyboard event hook (`onKeyDown`). We will modify it to handle `Escape` presses.
   - When `Escape` is pressed during `GameState.PLAYING`, the game transitions to `PAUSED` and calls `this.uiManager.showScreen('Pause')`.
   - When `Escape` is pressed during `GameState.PAUSED`, it returns to `PLAYING` and calls `this.uiManager.hideScreen()`.

3. **`PauseScreen` DOM Element:**
   - Extend `BaseScreen` to construct a new UI module (`src/ui/screens/PauseScreen.js`).
   - It will feature a semi-transparent black overlay `div` containing bold "PAUSED" typography.

## Risks / Trade-offs
- **Input Edge Cases**: Since `onKeyDown` relies on specific state strings, we must be careful not to trigger `Escape` toggle unpausing if the player is in `GAME_OVER` or `GAME_WIN` states. Toggling should only be processed between `PLAYING` and `PAUSED`.
- **Clock Desync**: By continuing to update `dt` within `GameLoop.js` but exiting `Game.js.update(dt)` early, we may accumulate a massive timestamp delta upon unpausing if we don't handle it properly. However, `GameLoop.js` inherently clamps `dt > 0.1 \rightarrow dt = 0.1`, which protects the game against the "spiral of death" or huge jumps, so it's a safe trade-off without requiring complex `lastTime` readjustment when resuming.
