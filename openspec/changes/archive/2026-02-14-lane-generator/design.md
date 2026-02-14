# Design: Lane Generator System

**Goal**: Automatically generate valid `Lane` objects (with Paths + Sockets) that respect the map terrain.

## 1. The Generator Pipeline

The `LaneGenerator` runs *before* the level starts (or during initialization).

### Input
- **Map Grid**: 2D array of `WALL`, `GROUND`, `WATER`, `SOCKET` (optional pre-placed).
- **Spawners**: List of `(x, y)` coordinates.
- **Terminal**: `(x, y)` coordinate.

### Process

#### Step 1: Base Path Calculation (A*)
For each Spawner:
1.  Run A* to find the optimal path to the Terminal.
2.  **Cost Function**:
    -   `GROUND`: 1
    -   `WATER`: Infinity (Impassable for enemies)
    -   `WALL`: Infinity
    -   **`SOCKET`: Infinity (Impassable for enemies)** - Crucial constraint. Lanes CANNOT cross sockets.

#### Step 2: Smoothing & Simplification
Convert the raw A* grid path into a **Polyline**.
-   Remove collinear points.
-   Result: `[{x,y}, {x,y}, ...]` (Key waypoints).

#### Step 3: Segmentation (Full Paths for v0)
We will generate full paths for each spawner. Overlapping segments are implicit (shared tiles).

#### Step 4: Socket Placement
For every tile along the generated path:
1.  Check adjacent tiles (N, S, E, W, Diagonals).
2.  **Validity Check**:
    -   Must be `GROUND`.
    -   Must NOT be part of *any* Lane Path.
    -   Must NOT be a Wall/Water/Socket.
3.  **Heuristic**:
    -   Prioritize "Curve Inner/Outer" spots (good visibility).
    -   Space them out (e.g., every 3-5 tiles).
4.  **Assignment**:
    -   Add this valid spot to the Lane's `sockets` list.
    -   Mark it as a `SOCKET` on the map (initially `HIDDEN_SOCKET`).

### Output
A `LevelData` object containing:
-   `map`: The grid (with Sockets marked).
-   `lanes`: Array of Lane Objects.
    ```javascript
    {
        id: 'LANE_1',
        path: [...],
        sockets: [{x,y}, {x,y}...]
    }
    ```

## 2. Runtime Behavior

-   **Map Loading**: `GameMap` initializes from `LevelData`.
    -   All Sockets are effectively invisible/collision-free initially.
-   **Telegraph**:
    -   `EncounterManager` activates `LANE_1`.
    -   Map renders `LANE_1` path.
    -   Map "wakes up" `LANE_1` sockets (visuals appear, `isBuildable` becomes true).
    -   **Debug**: Console logs path generation successes/failures and node counts.

## 3. Why this solves the user's issue
1.  **Respects Terrain**: The A* ensures lanes simply *cannot* exist on walls/water. They will naturally wind around obstacles.
2.  **Dynamic Sockets**: Sockets are placed *relative to the generated path*, ensuring they are always relevant to the threat.
3.  **No "Obliteration"**: We don't delete walls. We navigate around them.

## 4. Implementation Details
-   **Class**: `src/game/map/LaneGenerator.js`
-   **Algorithm**: Standard A* implementation.
-   **Integration**: Called in `Game.js` `reset()` or `GameMap` constructor.
