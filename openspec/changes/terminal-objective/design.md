# Design: Terminal Objective

## Context
Implementing the core defense target.

## Architecture

### 1. Terminal Class (`src/game/terminal.js`)
- **Properties:**
    - `x`, `y`: Position (Center of map).
    - `width`, `height`: Dimensions (e.g., 60x60).
    - `hp`: Current Health (Start: 1000).
    - `maxHp`: Max Health (1000).
    - `color`: `#00ffff` (Cyan).
- **Method:** `draw(ctx)`: Renders the terminal and a basic health bar.
- **Method:** `takeDamage(amount)`: Reduces HP. Returns `true` if destroyed.

### 2. Game Loop Integration (`src/main.js`)
- Instantiate `Terminal` at map center.
- In `update()`:
    - Check if Terminal is dead.
    - If dead, stop the loop (or show "GAME OVER" overlay).
- In `draw()`:
    - Call `terminal.draw(ctx)`.
    - If Game Over, draw big red text.

### 3. Debugging/Testing
- We don't have enemies yet, so we'll add a temporary key (e.g., `K`) to "Kill" / Damage the terminal to verify the Lose Condition.

## Visuals
- **Terminal:** Cyan box in the middle.
- **Health Bar:** Simple green/red bar above it.
