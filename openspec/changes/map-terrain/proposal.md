# Proposal: Map & Terrain

## Why

To validate "Terrain Tactics", we need a physical world with constraints. Choke points and obstacles are core to the design hypothesis.

## What Changes

We will implement:
- **Grid System:** A tile-based map format (2D array).
- **Terrain Types:**
    - `Ground`: Walkable.
    - `Wall`: Blocks Movement + Projectiles.
    - `Water`: Blocks Movement + Allows Projectiles (Shooting over gaps).
- **Collision:** Updates to Mech and Projectile logic to respect these rules.

## Capabilities

### Modified Capabilities
- `mech-movement`: Update `Mech.update()` to check map data before moving.
- `weapon-systems`: Update `Projectile.update()` to check map data for wall collisions.

### New Capabilities
- `map-system`: `Map` class, tile rendering, level data navigation.

## Impact

- **New:** `src/game/map.js`
- **Modify:** `src/main.js`, `src/game/mech.js`

## Success Criteria

- Mech stops when walking into a wall or water.
- Projectiles vanish when hitting a wall.
- Projectiles fly over water.
