# Tasks: Map & Terrain

## 1. Core Map System
- [ ] 1.1 Create `src/game/map.js` with `Map` class and collision methods.
- [ ] 1.2 Define a simple test level (Ground, Wall, Water).

## 2. Collision Integration
- [ ] 2.1 Update `Mech.update()` to check `map.isWalkable()` before moving.
- [ ] 2.2 Update `Projectile.update()` to check `map.isSolid()` (Wall) for destruction.

## 3. Rendering
- [ ] 3.1 Update `main.js` to draw the map background.

## 4. Verify
- [ ] 4.1 Verify Wall blocks movement.
- [ ] 4.2 Verify Water blocks movement but allows shooting.
- [ ] 4.3 Verify Wall blocks shooting.
