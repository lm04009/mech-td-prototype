# Proposal: Game Restart

## Why

Currently, when the player loses (Terminal HP reaches 0), the game enters a "GAME OVER" state that requires a full page refresh to restart. This interrupts the gameplay loop and is poor user experience.

## What Changes

We will implement a restart mechanism that allows the player to instantly reset the game state without reloading the page.

## Capabilities

### New Capabilities
- **In-Game Restart**: Players can press 'R' on the Game Over screen to restart the session.
- **State Management**: Introduce a formal `GameState` system (PLAYING, GAME_OVER) to manage transitions, making the game loop more robust and scalable.

## Impact

- `src/main.js`:
    - Introduce `GameState` enum/object.
    - Refactor `gameLoop` to use state machine logic.
    - Add `resetGame()` function to restore initial state.
    - Add keyboard listener for 'R' key.
