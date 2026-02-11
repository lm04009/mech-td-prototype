# Design: Map & Terrain

## Context
Implementing the physical world grid and collision rules.

## Architecture

### 1. Map Class (`src/game/map.js`)
- **Data:** 2D Array of integers (0=Ground, 1=Wall, 2=Water).
- **Properties:** `tileSize` (e.g. 40px), `width`, `height`.
- **Method:** `draw(ctx)`: Renders grid. Colors: 0=Grey, 1=Dark Grey, 2=Blue.
- **Method:** `getTileAt(x, y)`: Returns type at world coords.
- **Method:** `isWalkable(x, y)`: Returns true if Ground.
- **Method:** `isSolid(x, y)`: Returns true if Wall.

### 2. Mech Integration
- Mech needs reference to `Map` instance.
- In `update()`, calculate "next position".
- Check `map.isWalkable()` for the corners of the mech's collision box at "next position".
- If blocked, don't move (or slide - simple stop for v0).

### 3. Projectile Integration
- Projectile needs reference to `Map`.
- In `update()`, check `Math.floor(x / tileSize), Math.floor(y / tileSize)`.
- If `map.isSolid()` (Wall) -> Destroy projectile.

## Data Structures
- **Level Data:** Hardcoded 2D array in `src/game/level_data.js` (or directly in `main.js` for v0).

## Visuals
- **Ground:** `.222` (Background)
- **Wall:** `#555`
- **Water:** `#004488`
