# Design: Simple Enemy

## Context
Implementing the "Walker" enemy that follows a fixed, visible path to the Terminal.

## Architecture

### 1. Enemy Class (`src/game/enemy.js`)
- **Properties:**
    - `x`, `y`: Position.
    - `path`: Array of `{x, y}` coordinates.
    - `waypointIndex`: Current target node.
    - `speed`: Pixels/sec (e.g., 50).
    - `hp`: Health (e.g., 20).
    - `damage`: Damage to Terminal (e.g., 100).
- **Method:** `update(dt)`: Moves towards `path[waypointIndex]`. If distance < small_threshold, increment index.
- **Method:** `draw(ctx)`: Red box.

### 2. Path System (`src/game/path.js` or `main.js`)
- **Data:** Hardcoded `path` array (List of `{x, y}`).
- **Rendering:** `drawPath(ctx)`: Draws a line connecting all waypoints.

### 3. Wave Integration (`src/main.js`)
- **Spawn Timer:** Spawn an enemy at `path[0]` every X seconds.
- **Enemy List:** Manage active enemies (update, draw, cleanup).

### 4. Collision Logic
- **Projectile vs Enemy:** Checked in game loop. Simple distance check (Circle vs Box/Circle).
- **Enemy vs Terminal:** Checked in `Enemy.update`. If `waypointIndex` exceeds path length -> Damage Terminal -> Die.

## Visuals
- **Enemy:** Red Square (30x30).
- **Path:** Faint Red Line (`rgba(255, 0, 0, 0.3)`) on the floor.
