# Design: Wave System

## Overview
The `EncounterManager` will be upgraded from a simple timer to an event-driven director. It will read a static `EncounterDefinition` configuration and managing the state of multiple **Portals** (Lanes).

## Data Structures

### 1. Lane Definition (Map)
The `Map` will export constant path definitions.
```javascript
const PORTS = {
  NORTH: { id: 'NORTH', start: {x: 20, y: 0}, path: [...] },
  EAST:  { id: 'EAST',  start: {x: 49, y: 25}, path: [...] },
  // ...
};
```

### 2. Encounter Definition
A list of **Portal Events**.
```javascript
const LEVEL_1_ENCOUNTER = [
  {
    lane: 'NORTH',
    startTime: 5,   // Seconds from game start
    count: 10,      // Total enemies
    interval: 1.5,  // Seconds between spawns
    enemyType: 'BASIC' // Total Duration: 15s (Ends at T=20)
  },
  {
    lane: 'EAST',
    startTime: 12,  // Starts BEFORE North finishes (Overlap!)
    count: 15,
    interval: 1.2,
    enemyType: 'BASIC'
  }
];
```

### 3. Runtime State (`EncounterManager`)
-   **`events`**: Queue of upcoming events (sorted by time).
-   **`activePortals`**: List of currently spawning portals.
    -   `{ lane, remaining, timer, interval, type }`
-   **`activeLanes`**: Set of lanes that have been activated (for rendering active paths).
-   **`telegraphLanes`**: Set of lanes currently in "Preview" mode (startTime - 5s).

## Class Changes

### `src/game/map.js`
-   **New Methods**:
    -   `getLanePath(laneId)`: Returns the array of points for a specific lane.
    -   `getAllLanes()`: Returns definitions for all possible lanes.
-   **Rendering**:
     -   Needs to expose path data so `Game.js` or `EncounterManager` can draw them.
     -   (Decision): `Game.js` will handle the drawing of paths based on `EncounterManager` state to keep Map logic pure.

### `src/game/EncounterManager.js`
-   **Properties**:
    -   `encounterTime`: Tracks total time.
    -   `events`: The loaded level data.
-   **Update Loop**:
    1.  Update `encounterTime`.
    2.  Check for **Telegraphs**: If `event.startTime - 5 < time`, add to `telegraphLanes`.
    3.  Check for **Activations**: If `event.startTime <= time`, move from events to `activePortals`. Add to `activeLanes`. Remove from `telegraphLanes`.
    4.  Update **Active Portals**:
        -   Tick spawn timers.
        -   Spawn enemy if timer ready.
        -   Decrement `remaining`.
        -   If `remaining == 0`, remove from `activePortals`.

### `src/game/Game.js`
-   **Rendering**:
    -   Draw **Active Paths**: Iterate `encounter.activeLanes`, draw solid line/glow.
    -   Draw **Telegraph Paths**: Iterate `encounter.telegraphLanes`, draw faded/dashed line.

## Visuals
-   **Telegraph**: Grey/White, 0.3 Alpha, Dashed Line?
-   **Active**: Red/Orange, 0.8 Alpha, Solid Line + Glow.
-   **Portal**: Simple circle at the start of the lane (Green for Active?).

