# Design: Tower Construction

## Context

We need to add the ability to build stationary towers to defend the Terminal.

## Goals

- **Grid Alignment**: Towers must snap to tiles.
- **Validation**: Cannot build on obstacles.
- **Economy**: Building costs resources.
- **Combat**: Towers should function autonomously.

## Decisions

### Decision 1: Tower Class
`src/game/tower.js`
- `constructor(col, row, cost)`: Positioned by grid coordinates (integers), not pixels. Pixel position derived: `x = col * TILE_SIZE + TILE_SIZE/2`.
- `update(dt, enemies)`: Find target, cooldown, fire.
- `draw(ctx)`: Render base + rotating turret.

### Decision 2: Socket System (Revised)
Instead of free placement, we use **Sockets**.
- `TERRAIN.SOCKET` added to Map.
- `setupTestLevel()` will be updated to place sockets at:
    -   **Choke Points**: Near the "Inner Ring" gates.
    -   **Terminal**: A ring of defense around the base.
    -   **Lanes**: A few scattered spots along the main path.
- `GameMap.isBuildable(col, row)` returns true ONLY if tile is `SOCKET` and empty.

### Decision 3: Map Occupancy
- The Map data itself (`this.tiles`) defines *validity* (Socket vs Ground).
- A separate `this.towers` map (or array) tracks *occupancy*.

### Decision 3: Placement State (Ghost)
In `main.js`:
- `constructionMode`: boolean.
- `ghostTower`: Object tracking current mouse grid position.
- On `mousemove`: Update ghost position (snap to grid). Check validity (Green/Red).
- On `click`: If valid && affordable -> Build.

### Decision 4: Economy
Simple global integer `credits`.
- `addCredits(amount)`
- `spendCredits(amount)` -> returns boolean (success/fail).
- UI overlay to show current credits.

### Decision 5: Projectile Reuse
We can reuse `src/game/projectile.js`. It already handles collision. We just need to make sure the "owner" (Mech vs Tower) doesn't matter for physics, or add a flag if we want Friendly Fire protection (currently not needed, bullets hit enemies).

## Tradeoffs

- **Performance**: Iterating all enemies for every tower every frame `O(T * E)` might be slow with hundreds of towers. For v0 (10-20 towers), it is fine.
- **Complexity**: Collision with map walls for tower bullets means we reusing the same physics as the Mech, which is good for consistency.
