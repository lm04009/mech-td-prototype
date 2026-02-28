# click-to-move Tasks

## 1. New `Pathfinder.js` engine utility

- [x] 1.1 Create `src/engine/Pathfinder.js` with `findPath(startGrid, endGrid, isWalkable, gridW, gridH)` using 8-directional A* (cardinal cost 1.0, diagonal cost √2, octile heuristic)
- [x] 1.2 Add `snapToNearestWalkable(targetGrid, isWalkable, gridW, gridH)` BFS ring-expansion fallback — returns nearest walkable tile when target is not walkable
- [x] 1.3 Pathfinder returns array of `{x, y}` grid-space waypoints (caller converts to world space via `TILE_SIZE`)

## 2. `GameMap` — mech-aware walkability

- [x] 2.1 Add `isWalkableFor(gx, gy, legsData)` to `GameMap`:
  - WALL → false
  - WATER → `legsData.canCrossWater === true` (default false)
  - SOCKET with placed tower → false
  - GROUND, HIDDEN_SOCKET, empty SOCKET → true
- [x] 2.2 Keep existing `isWalkable(worldX, worldY)` unchanged (used by collision system)

## 3. `Mech.js` — waypoint follower

- [x] 3.1 Remove `inputVector` from `mech.update()` signature
- [x] 3.2 Add `mech.activePath` (array of world-space `{x, y}`) and `mech.pathWaypointIndex`
- [x] 3.3 Replace WASD movement block with: steer toward `activePath[pathWaypointIndex]` at `mech.speed`; advance index when within 5px; clear path at end
- [x] 3.4 Apply legs-destroyed speed penalty (50% reduction) to waypoint steering speed (unchanged from WASD logic)
- [x] 3.5 Add `mech.setPath(worldWaypoints)` — replaces current `activePath` and resets `pathWaypointIndex`

## 4. `Input.js` — clean up WASD

- [x] 4.1 Remove W/A/S/D key tracking from `this.keys`
- [x] 4.2 Remove `getMovementVector()` method
- [x] 4.3 Retain 1/2/3 key tracking and all mouse tracking (unchanged)

## 5. `Game.js` — wire click-to-move and re-path throttle

- [x] 5.1 Remove `const movement = this.input.getMovementVector()` and the `movement` argument from `mech.update()`
- [x] 5.2 Add `this.repathThrottleMs = 0` and `this.moveDestWorld = null` to game state
- [x] 5.3 On LMB down (new press edge): immediately compute path — convert `mouseWorld` to grid → `snapToNearestWalkable` if needed → `Pathfinder.findPath` → `mech.setPath(worldWaypoints)`; spawn click ring
- [x] 5.4 On LMB held: decrement `repathThrottleMs` by `dt * 1000`; when ≤ 0 and not hovering socket, recompute path and reset throttle to 100ms
- [x] 5.5 Suppress move click when `hoveringSocket` is true (already suppressed for build — extend same guard)

## 6. Click ring visual

- [x] 6.1 In `Game.js`, add `this.clickRings = []` array
- [x] 6.2 On LMB move click: push `{ x: worldX, y: worldY, timerMs: 300 }`
- [x] 6.3 In `draw()`, render each ring in world space: radius = `lerp(0, 20, 1 - timer/300)`, alpha = `timer/300`; remove when timer ≤ 0
- [x] 6.4 Draw click rings above map layer, below mech

## 7. Verification

- [ ] 7.1 Manual: Click ground → mech pathfinds around walls and water to destination
- [ ] 7.2 Manual: Hold LMB and drag → mech continuously re-routes toward cursor
- [ ] 7.3 Manual: Click unreachable tile (inside wall cluster) → mech moves to nearest accessible point, no freeze
- [ ] 7.4 Manual: Click a socket → tower builds, mech does not move
- [ ] 7.5 Manual: Build a tower mid-mech-path → mech reroutes around it within ~100ms
- [ ] 7.6 Manual: Destroy mech legs → mech continues to pathfind at half speed
- [ ] 7.7 Manual: Click ring appears at click point, expands and fades over ~300ms
- [ ] 7.8 Manual: Mech continues to face mouse cursor while moving (angle tracking unchanged)
- [ ] 7.9 Manual: No WASD response — pressing W/A/S/D has no effect on mech movement
