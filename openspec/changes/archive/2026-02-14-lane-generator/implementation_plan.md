# Implementation Plan - Lane Generator

The goal is to implement a **Lane Generator** that runs at level start to calculate valid paths around terrain and place sockets intelligently.

## User Review Required
> [!IMPORTANT]
> **Constraint Checklist**:
> - Paths are static (calculated once).
> - **Sockets are Impassable**: Lanes will treat sockets as walls.
> - **Debug Logging**: The generator will output detailed console logs for debugging.

## Proposed Changes

### Game Logic (`src/game/map`)

#### [NEW] [LaneGenerator.js](file:///c:/000%20move/Projects/TDFM/mech-td-prototype/src/game/map/LaneGenerator.js)
-   **Class**: `LaneGenerator`
-   **Method**: `generateLanes(mapGrid, spawners, terminal)`
-   **Logic**:
    1.  A* Pathfinding (Cost: Ground=1, Wall/Water/Socket=Infinity).
    2.  Path Smoothing (getting key waypoints).
    3.  **Socket Count Logic**:
        -   Constants: `SHORT=20`, `LONG=100`, `MIN=2`, `MAX=10`.
        -   `t = (Length - SHORT) / (LONG - SHORT)`.
        -   `count = Round(Lerp(MIN, MAX, t))`.
    4.  **Socket Placement**:
        -   Distribute `count` sockets evenly along the path.
        -   Scan for valid adjacent ground (spiral search).
        -   **Safety**: Best Effort. If blocked, skip socket and log warning. Do NOT crash.
    5.  Returns `lanes` array with `{ path, sockets }`.

#### [MODIFY] [map.js](file:///c:/000%20move/Projects/TDFM/mech-td-prototype/src/game/map.js)
-   Remove hardcoded `defineLanes()`.
-   Update `setupTestLevel()` to:
    1.  Define Terrain (Walls/Water).
    2.  Define Spawners/Terminal.
    3.  Call `LaneGenerator`.
    4.  Apply generated Sockets to the Map.

#### [MODIFY] [EncounterManager.js](file:///c:/000%20move/Projects/TDFM/mech-td-prototype/src/game/EncounterManager.js)
-   Update to use the generated `Lane` objects (which now contain the sockets).
-   Ensure `activatePortal` unlocks the specific sockets for that lane.

## Verification Plan

### Automated Tests
-   *None (No test framework yet).*

### Manual Verification
1.  **Launch Game**: Open browser to `localhost:8000`.
2.  **Open Console**: F12 to check logs.
    -   **Detailed Logging**:
        -   `LaneGenerator: Generating LANE_X`
        -   `LaneGenerator: Path Length = 45 tiles`
        -   `LaneGenerator: Target Sockets = 6`
        -   `LaneGenerator: Placed Sockets = 6` (or warning if less)
3.  **Visual Check**:
    -   Press `R` (Restart) to trigger generation.
    -   Wait for a wave to telegraph.
    -   **Confirm**: Lane path avoids walls/water.
    -   **Confirm**: Sockets appear along the path.
    -   **Confirm**: Path does NOT cross any socket (if we place a dummy socket to test).
