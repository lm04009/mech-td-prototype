# Design: Weapon Systems

## Context
Adding the ability to shoot. This involves mouse tracking, range checks, and projectile management.

## Architecture

### 1. Input Handler Update (`src/game/input.js`)
- Add `mousemove` listener to track cursor position (world coordinates).
- Add `mousedown` listener to trigger firing.

### 2. Weapon Class (`src/game/weapon.js`)
- Properties: `range`, `cooldown`, `projectileSpeed`, `color`.
- Method: `aim(targetX, targetY)`: Calculates angle/vector.
- Method: `fire(originX, originY, targetX, targetY)`:
    - Checks 1: Cooldown ready?
    - Checks 2: Target in range? (Strict enforcement per spec).
    - If valid: Spawns a `Projectile`.

### 3. Projectile Class (`src/game/projectile.js`)
- Properties: `x`, `y`, `vx`, `vy`, `life`.
- Method: `update(dt)`: Moves and reduces life.
- Method: `draw(ctx)`: Renders itself.

### 4. Integration (`src/main.js` & `src/game/mech.js`)
- `Mech` owns `Weapon` instances (initially just one on an arm).
- `Mech.update()` calls `Weapon.update()` (for cooldowns).
- Global `ProjectileManager` (or simple array in `main.js`) handles active projectiles.

## Data Structures
- **Projectile Array:** Simple list of active projectiles. Filter out dead ones each frame.

## Visuals
- **Range Indicator:** When aiming, draw a faint circle around the mech showing max range.
- **Projectiles:** Simple colored lines or small circles.
