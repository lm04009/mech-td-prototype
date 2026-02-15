# Implementation Plan - Unified Collision Detection

The goal is to implement a consistent collision detection layer that allows all entities to query the map and each other for obstacles, without imposing generic physics (velocity/bounce) on the path-following Enemies.

## User Review Required

> [!IMPORTANT]
> **Socket Behavior**: Visible Sockets (`TERRAIN.SOCKET`) and Active Towers will be **Impassable** for the Player. Hidden Sockets (`TERRAIN.HIDDEN_SOCKET`) will remain **Passable**.
>
> **Spawn Safety (Option A - Selected)**: If a socket attempts to spawn under the player:
> 1.  The spawn is **Deferred**. The socket remains "Hidden" (Passable).
> 2.  It is added to a `pendingSockets` queue.
> 3.  Every frame, the Map checks if the player has moved off the socket.
> 4.  Once clear, the socket spawns (becomes Visible & Impassable).
>
> **Enemy Movement**: Enemies will retain their path-following logic. They will not "bounce" or "slide". They will **Stop** (Block) if their path is physically obstructed by the Player or dynamic obstacles, preventing "clipping".

## Proposed Changes

### Engine Layer

#### [NEW] [Collision.js](file:///c:/000%20move/Projects/TDFM/mech-td-prototype/src/engine/Collision.js)
- A stateless helper for geometric checks.
- `checkCircleRect(circle, rect)`: For Entity vs Tile collision.
- `checkCircleCircle(c1, c2)`: For Entity vs Entity collision.
- `getSlideVector(velocity, normal)`: Helper for Player sliding logic.

### Game Logic

#### [MODIFY] [map.js](file:///c:/000%20move/Projects/TDFM/mech-td-prototype/src/game/map.js)
- **State**: Add `this.pendingSockets = []`.
- **Method `unlockLaneSockets`**:
    -   Check if Player is on top of any target socket.
    -   If blocked? Add to `pendingSockets`.
    -   If clear? Reveal immediately.
- **Method `update(dt, player)`**:
    -   Iterate `pendingSockets`.
    -   Check if Player is clear.
    -   If clear -> Reveal `TERRAIN.SOCKET` and remove from queue.
- **Refine `isWalkable(x, y)`**:
    -   Must check `this.tiles` grid AND `this.towers` array.
    -   `SOCKET` (Visible) = `false`.
    -   `HIDDEN_SOCKET` = `true` (Passable).
    -   `Tile with Tower` = `false`.

#### [MODIFY] [mech.js](file:///c:/000%20move/Projects/TDFM/mech-td-prototype/src/game/mech.js)
- Import `Collision.js`.
- Update `update` loop:
    -   **Map Collision**: Check intended next position against `map.isWalkable`.
        -   If blocked by Wall/Tower/Socket? -> **Slide** along the edge.
    -   **Entity Collision**: Check against `game.entities.enemies` and `game.terminal`.
        -   If blocked? -> **Stop** or **Slide**.

#### [MODIFY] [enemy.js](file:///c:/000%20move/Projects/TDFM/mech-td-prototype/src/game/enemy.js)
- Retain `followPath`.
- Update `isBlocked` logic to be consistent:
    -   Use `Collision.checkCircleCircle` for Player/Terminal checks.
    -   Use `Collision.checkCircleCircle` for queuing against other enemies.

#### [MODIFY] [Game.js](file:///c:/000%20move/Projects/TDFM/mech-td-prototype/src/game/Game.js)
- Update `update(dt)`:
    -   Call `this.map.update(dt, this.mech)` to process pending sockets.

## Verification Plan

### Manual Verification
1.  **Socket Interaction**:
    -   Walk onto a Hidden Socket.
    -   Wait for spawn event -> **Socket stays Hidden**.
    -   Walk off -> **Socket Activates** immediately.
    -   Try to walk back -> **Blocked**.
2.  **Tower Interaction**:
    -   Build Tower -> Walk into it -> **Block/Slide**.
3.  **Enemy Interaction**:
    -   Stand in Enemy Path -> Enemies **Stop** at Player.
    -   Run into Enemy -> Player **Stops/Slides** (can't walk through).
