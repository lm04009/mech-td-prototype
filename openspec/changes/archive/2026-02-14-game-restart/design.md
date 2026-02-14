# Design: Game State Machine

## Context

The current game uses a simple boolean `gameOver` flag to stop the loop. We want to replace this with a robust State Machine to support standard game flow (Playing -> Game Over -> Playing).

## Goals

- **Robustness**: Prevent "zombie" states where entities update after game over.
- **Extensibility**: Make it easy to add "Main Menu" or "store" states later.
- **Clarity**: Centralize state transition logic.

## Decisions

### Decision 1: `GameState` Object

We will use a simple Javascript object as an Enum to define states:

```javascript
const GameState = {
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER'
};
```

### Decision 2: `gameLoop` Refactor

The `gameLoop` will switch on the current state:

```javascript
function gameLoop(timestamp) {
    // ... calculate dt ...

    switch (currentState) {
        case GameState.PLAYING:
            updatePlaying(dt);
            drawPlaying(ctx);
            break;
        case GameState.GAME_OVER:
            // No update, just draw overlay
            drawGameOver(ctx);
            break;
    }
    
    requestAnimationFrame(gameLoop);
}
```

### Decision 3: `resetGame()`

A dedicated function will handle the transition back to `PLAYING` by explicitly resetting all game entities. This prevents "state leaks" where old enemies or projectiles persist.

## Tradeoffs

- **Verbosity**: This adds more boilerplate than a simple `if (gameOver) return;`, but the structural benefits for a growing game outweigh the extra lines of code.
