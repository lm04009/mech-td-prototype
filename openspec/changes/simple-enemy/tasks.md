# Tasks: Simple Enemy

## 1. Path System
- [ ] 1.1 Define a hardcoded path in `main.js` (Start -> Waypoints -> Terminal).
- [ ] 1.2 Implement `drawPath(ctx)` to visualize the route.

## 2. Enemy Entity
- [ ] 2.1 Create `src/game/enemy.js` with path following logic.
- [ ] 2.2 Implement `update(dt)` (Movement & Terminal damage).
- [ ] 2.3 Implement `draw(ctx)` (Red box).

## 3. Wave System
- [ ] 3.1 Update `main.js` to spawn enemies periodically.
- [ ] 3.2 Update loop to handle enemy updates and drawing.

## 4. Combat Integration
- [ ] 4.1 Update loop to check Projectile vs Enemy collision.
- [ ] 4.2 Verify Enemy death and Terminal damage.

## 5. Verify
- [ ] 5.1 Verify Path is visible.
- [ ] 5.2 Verify Enemies follow the path.
- [ ] 5.3 Verify Shooting kills enemies.
- [ ] 5.4 Verify Leaking enemies hurt Terminal.
