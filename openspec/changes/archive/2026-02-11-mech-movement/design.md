# Design: Mech Movement

## Context
We are implementing the first "Active" component: player movement.

## Goals
- Responsive WASD movement.
- foundation for "Legs" part affecting speed (future).

## Architecture

### 1. Input Handler (`src/game/input.js`)
- Listens for `keydown` / `keyup`.
- Maintains state of currently pressed keys.
- Exposes a `getMovementVector()` method returning `{x, y}` (normalized).

### 2. Mech Class (`src/game/mech.js`)
- Properties: `x`, `y`, `speed`, `velocity`.
- Method: `update(dt)`:
    - Gets input vector.
    - Applies speed.
    - Updates x/y.
- Method: `draw(ctx)`:
    - Renders a simple shape (e.g., a green square with a direction indicator) to represent the mech.

### 3. Loop Integration (`src/main.js`)
- Instantiate `InputHandler` and `Mech`.
- Call `mech.update(dt)` and `mech.draw(ctx)` in the game loop.

## Constraints
- **Boundaries:** For v0, we won't strictly enforce map boundaries yet (infinite void is fine for testing movement), but we'll prepare for it.
