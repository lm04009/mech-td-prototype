# Walkthrough - Lane Generator Implementation

I have implemented the **Lane Generator** system to dynamically create valid enemy paths and place defensive sockets based on terrain constraints.

## Changes

### 1. Lane Generator Logic (`src/game/map/LaneGenerator.js`)
-   **A* Pathfinding**: Calculates optimal paths from Spawners to the Terminal, navigating around Walls and Water.
-   **Socket Count Logic**: Uses Linear Interpolation (Lerp) to determine socket count based on path length:
    -   Short paths (~20 tiles) get **2** sockets.
    -   Long paths (~100 tiles) get **10** sockets.
-   **Socket Placement**: Distributes sockets evenly along the path, scanning for valid ground using a spiral search (Best Effort).
-   **Safety**: Logs warnings if sockets cannot be placed, but does not crash.

### 2. Map Integration (`src/game/map.js` & `src/game/Terrain.js`)
-   Refactored `GameMap` to use `LaneGenerator`.
-   Introduced `TERRAIN.HIDDEN_SOCKET` to allow sockets to exist but remain inactive until needed.
-   Added `unlockLaneSockets(laneId)` to convert `HIDDEN_SOCKET` -> `SOCKET`.
-   Extracted `TERRAIN` constants to `src/game/Terrain.js` to resolve circular dependencies.
-   **5th Portal**: Added `CUSTOM` portal at `(35, 35)` (South-East) per user request.

### 3. Encounter Logic (`src/game/Config.js` & `src/game/EncounterManager.js`)
-   Updated `EncounterManager` to trigger `unlockLaneSockets` when a lane is **Telegraphed** or **Activated**.
-   **Fix**: Resolved a runtime crash by removing a reference to a missing helper method.
-   **Config**: Activated **ALL 5 Portals** (North, South, East, West, Custom).
    -   *Correction*: Fixed missing `NORTH` configuration entry.

### 4. Enemy AI (`src/game/enemy.js`)
-   **Traffic Control**:
    -   **Separation**: Enemies push away from each other if too close.
    -   **Braking**: Enemies slow down (50 -> 30 speed) when crowded (>2 neighbors) to prevent jittery stacking.
    -   **No Wall collision**: Pure boids-based traffic flow as requested.

## Verification Results

### Pathfinding & Socket Placement
Verified via headless script `test_lane_gen.js`:
-   **West Lane**: Path found around obstacles. Length: 34 tiles. Sockets: 3.
-   **North/South/East**: Straight paths found. Length: ~24 tiles. Sockets: 2.
-   **Validation**: All sockets placed on valid ground.

### Custom Portal
-   Added at `(35, 35)`.
-   Configured to spawn a heavy wave (20 enemies) at T=30s.

## Next Steps
-   Launch the game and observe the visual flow.
-   Verify "Blight-style" visuals (sockets appearing only when lane is active).
