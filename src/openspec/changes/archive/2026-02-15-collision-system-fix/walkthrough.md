# Walkthrough - Unified Collision System

## Goal
Fix inconsistent collision behavior where players could walk through enemies/structures, and implement a safe spawn mechanism to prevent players from being trapped by newly spawned sockets.

## Changes

### 1. Engine Layer
-   **New** `src/engine/Collision.js`: Added geometric collision checks (Circle vs Rect, Circle vs Circle) to standardize hit detection.

### 2. Map System
-   **Refined** `GameMap.js`:
    -   `pendingSockets`: Implemented a queue system. If a socket attempts to spawn while the player is standing on it, it waits in this queue until the player moves away.
    -   `getObstacles(rect)`: Added helper to return all nearby relevant colliders (Walls, Towers, Visible Sockets).
    -   `isWalkable()`: Updated to correctly identify Visible Sockets as obstacles.

### 3. Entity Integration
-   **Updated** `Mech.js`: 
    -   Replaced simple tile checks with `Collision.checkCircleRect` against Map Obstacles.
    -   Added entity collision checks against Enemies and Terminal.
    -   Implemented a sliding response to wall collisions.
-   **Updated** `Enemy.js`:
    -   Integrated `Collision.js` for robust collision detection against Player and other Enemies.
    -   Maintained "Stop" behavior (hard collision) to prevent clipping.

### 4. Game Logic
-   **Updated** `Game.js`:
    -   Added `map.update()` call to process pending spawn queue.
    -   Added check in `tryBuildTower` to prevent building structures on top of the player.

## Verification Results

### Manual Testing
-   [x] **Pending Spawn**: Confirmed sockets do not spawn underfoot; they appear immediately after moving away.
-   [x] **Player Movement**: Confirmed player slides along walls and cannot pass through enemies or towers.
-   [x] **Construction**: Confirmed building is denied if player overlaps the target socket.

## Next Steps
-   Fine-tune collision radii if players feel "stuck" too easily.
-   Consider adding a visual indicator for "Pending Sockets" (e.g. flashing warning) in future updates.
