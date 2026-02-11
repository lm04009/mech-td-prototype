# Proposal: Simple Enemy

## Why

Now that we have a Terminal to defend, we need something to defend it *from*. This change introduces the core threat.

## What Changes

We will implement:
- **Enemy Entity:** A basic "Walker" enemy (Red box).
- **Paths:** A defined list of waypoints (Map coordinates) leading to the Terminal.
- **Spawning:** Enemies spawn at the start of a Path.
- **AI:** Enemies follow the path strictly (Waypoint to Waypoint).
- **Combat:**
    - Enemies take damage from Projectiles.
    - Enemies deal damage to the Terminal when they reach the end of the path.

## Capabilities

### Modified Capabilities
- `terminal-objective`: Terminal needs to take damage from enemies.
- `weapon-systems`: Projectiles need to hit enemies.

### New Capabilities
- `enemy-ai`: Path following logic.
- `map-system`: Need to define paths (hardcoded for v0).

## Out of Scope (For this change)
- **Player Damage:** Enemies will NOT attack the player yet. They are single-minded (Blight-style) for now. We will add `enemy-combat` in a later change.
- **Pathfinding:** Hardcoded paths for v0. No A*.

## Impact

- **New:** `src/game/enemy.js`
- **Modify:** `src/main.js` (Wave logic, Path data), `src/game/projectile.js` (Collision).

## Success Criteria

- Enemies spawn at start of a defined path.
- Enemies move along the path (not just straight to center).
- Shooting an enemy kills it.
- Reaching the end of the path damages the Terminal.
