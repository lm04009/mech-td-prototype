## Context

Player movement currently uses WASD keyboard input: `Input.getMovementVector()` returns a normalized `{x, y}` vector each frame which `Mech.update()` applies directly via slide-collision. This is a placeholder that doesn't match the intended game feel or the prototype's validation goals (meaningful positioning around terrain and choke points).

The map already exposes `isWalkable(worldX, worldY)` and the tile grid is 50×50. The `LaneGenerator` already contains a complete A* implementation, but it is tightly coupled to lane generation and enemy pathing — it cannot be reused for player movement directly.

## Goals / Non-Goals

**Goals:**
- LMB click on ground → mech pathfinds to that point (PoE Blight-style)
- Re-path continuously while LMB is held (~100ms throttle)
- LMB on socket → build tower (existing behavior unchanged)
- Walkability is mech-state-aware to support future leg types (e.g. hover legs cross water)
- BFS snap: unreachable clicks route silently to nearest walkable tile
- PoE-style click ring: brief expand+fade circle at click point in world space
- Remove WASD movement entirely

**Non-Goals:**
- Path preview/visualization on the ground
- Navigation mesh — tile grid is sufficient for this map scale
- HPA* or Jump Point Search — 50×50 grid does not require them
- Enemy pathfinding changes — enemies remain strictly lane-bound (separate system)

## Decisions

### D1: New standalone `Pathfinder.js` — do not reuse LaneGenerator

`LaneGenerator.findPath()` is 4-directional, coupled to lane-generation walkability rules, and deeply embedded in map generation. The mech needs 8-directional movement, mech-state-aware walkability, and BFS snap — all incompatible with `LaneGenerator`. A clean new `src/engine/Pathfinder.js` utility keeps concerns separated and is reusable for any future agent.

### D2: Walkability callback pattern

`Pathfinder.findPath(start, end, isWalkable)` accepts a callback rather than calling `GameMap` directly. The mech constructs this callback at call time based on its current parts state:

```js
const isWalkable = (gx, gy) => this.game.map.isWalkableFor(gx, gy, this.parts.legs);
```

`GameMap.isWalkableFor(gx, gy, legsData)` resolves terrain against legs capabilities. Hover legs will set `canCrossWater: true` in `legs.json` — zero pathfinder code changes needed when they're added.

### D3: 8-directional A* with diagonal cost √2

Diagonal movement is natural for a mech moving freely in world space. Using cost `1.0` for cardinals and `1.414` for diagonals produces optimal paths. The heuristic remains octile distance (Manhattan adjusted for diagonals).

### D4: Re-path throttle at ~100ms, immediate on new press

Running A* every frame while LMB held is unnecessary. Re-pathing every 100ms is imperceptible to players and drops CPU from 60 runs/sec to 10. A new click (LMB down edge) triggers an immediate re-path regardless of throttle, ensuring responsiveness.

### D5: BFS snap for unreachable destinations

When A* returns null, a BFS ring-expansion from the target tile finds the nearest walkable tile. The mech paths there silently — no error state, no freeze. This matches PoE's behavior exactly and prevents any stuck-state.

### D6: Mech stores active path as waypoint list

`mech.activePath` = array of `{x, y}` world-space waypoints. `mech.pathWaypointIndex` tracks progress. Each frame, steer toward current waypoint; advance when within 5px (matching `Enemy.followPath` arrival threshold). On reaching the final waypoint, clear the path and stop.

### D7: WASD removed entirely

`Input.js` retains `1`, `2`, `3` key tracking (weapon slots). W/A/S/D keys and `getMovementVector()` are removed. `Mech.update()` signature changes: `inputVector` parameter removed. `Game.js` stops calling `getMovementVector()`.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Tower-build and move-click both on LMB | Already disambiguated: `hoveringSocket` check in `Game.js` gates builds. Add: if `hoveringSocket`, suppress move click too. |
| Towers built mid-path block the route | Next re-path (~100ms) routes around them automatically via updated `isWalkableFor`. |
| Camera follows mech — click pos is in screen space | `Input.getMouseWorld(camera)` already converts to world space. Pathfinder receives world pos, converts to grid via `Math.floor(x / TILE_SIZE)`. |
| 8-dir A* openSet is an unsorted array (O(n²)) | On a 50×50 grid this is ~2500 nodes max. Acceptable without a priority queue. Note for future: swap to a min-heap if maps grow to 200×200+. |
