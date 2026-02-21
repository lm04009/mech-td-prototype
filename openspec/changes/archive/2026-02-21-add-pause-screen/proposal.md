# Proposal: Add Pause Screen

## Why
Currently, there is no way for the player to pause the game. We need a pause screen to let the user temporarily freeze gameplay during active missions. This also lays the foundation for a future feature-rich pause menu (e.g., for accessing settings, or returning to the title screen). It is an essential feature for a complete game loop.

## What
Implement a basic pause screen toggleable via the `ESC` key. When activated, it will transition the game state and pause the primary game loop's entity and system updates. When deactivated, gameplay resumes precisely where it left off. The solution will hook into the existing UI framework (`UIManager`) and state engine (`GameState.js`) without breaking current game features or assumptions (e.g. `Game.js` update loop, camera, or input logic). 

## New Specs
- `pause-screen`: The visual DOM-based UI overlay for the paused state, defining its appearance and basic toggle interactions.

## Modified Specs
- `game-state`: Requires a new `PAUSED` state to properly halt processing while in the paused state without affecting active gameplay values.
- `input-handling`: Interactions with the `ESC` key to trigger game state transitions.

## Impact
- Core game state logic within `Game.js` will need to check against `GameState.PAUSED` to avoid executing movement, logic or combat updates, and rendering should be maintained but logic frozen.
- The `UIManager` will manage the new `PauseScreen` display lifecycle, similar to `GameOverScreen` and `GameWinScreen`.
