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
    -   `SOCKET`: 5 (Discourage walking on sockets if possible, but allow crossing if necessary).

#### Step 2: Smoothing & Simplification
Convert the raw A* grid path into a **Polyline**.
-   Remove collinear points.
-   Result: `[{x,y}, {x,y}, ...]` (Key waypoints).

#### Step 3: Segmentation (Optional for v0, but better)
Identify common path sections.
-   If Lane A and Lane B share the last 20 tiles, create a shared `LaneSegment` for that part.
-   *For v0, we can skip complex graph merging and just treat overlapping tiles as shared.*



#### Step 4: Socket Count Calculation
Decide **how many** sockets this lane gets based on its length using Linear Interpolation.

**Constants**:
-   `MIN_SOCKETS`: 2
-   `MAX_SOCKETS`: 10
-   `SHORT_PATH_LEN`: 20 tiles
-   `LONG_PATH_LEN`: 100 tiles

**Logic**:
1.  `L = path.length`
2.  Calculate factor `t`:
    ```javascript
    t = (L - SHORT_PATH_LEN) / (LONG_PATH_LEN - SHORT_PATH_LEN);
    t = Clamp(t, 0, 1); // Ensure 0..1 range
    ```
3.  Linearly Interpolate:
    ```javascript
    rawCount = MIN_SOCKETS + t * (MAX_SOCKETS - MIN_SOCKETS);
    finalCount = Math.round(rawCount);
    ```

#### Step 5: Socket Placement
Distribute `finalCount` sockets along the path.
1.  `interval = pathLength / finalCount`
2.  For `i = 0` to `finalCount - 1`:
    -   `idealIndex = Math.floor(i * interval + interval / 2)` (Center of the segment)
    -   **Scan**: Look at `path[idealIndex]` and neighbors.
    -   **Find Valid Spot**:
        -   Must be `GROUND`.
        -   Must NOT be `WALL` / `WATER` / `SOCKET` / `PATH`.
    -   **Search Radius**: If the ideal spot is invalid, spiral out (radius 1, 2, 3...) to find the nearest valid spot.
    -   **Best Effort**: If no valid spot is found within MAX_SEARCH_RADIUS (e.g., 5), **skip** this socket.
    -   **Log Warning**: If `placedCount < finalCount`, log a warning: `LaneGenerator: Wanted 6 sockets, could only place 4.`

#### Step 6: Validation
-   If `placedCount < MIN_SOCKETS`, log a **ERROR** (Level Design issue), but do not crash.




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

## 3. Why this solves the user's issue
1.  **Respects Terrain**: The A* ensures lanes simply *cannot* exist on walls/water. They will naturally wind around obstacles.
2.  **Dynamic Sockets**: Sockets are placed *relative to the generated path*, ensuring they are always relevant to the threat.
3.  **No "Obliteration"**: We don't delete walls. We navigate around them.

## 4. Implementation Details
-   **Class**: `src/game/map/LaneGenerator.js`
-   **Algorithm**: Standard A* implementation.
-   **Integration**: Called in `Game.js` `reset()` or `GameMap` constructor.
