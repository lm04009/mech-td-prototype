# Lane-Socket Association Design

**Core Mechanic**: Towers can only be built on Sockets that belong to an **Active** or **Telegraphed** Lane.

## 1. The Problem
Currently, `map.js` defines:
- **Terrain**: A grid of tiles (WALL, GROUND, SOCKET).
- **Lanes**: Arrays of points (Start -> End).
- **No Link**: Sockets are just global "buildable spots". You can build on a socket for a lane that isn't even being attacked yet.

## 2. The Solution: Lane Objects
We need to group Sockets *into* the Lane definition.

### Data Structure
Instead of just an array of points, a Lane is an object:

```javascript
const LANE_NORTH = {
    id: 'NORTH',
    path: [{x: 25, y: 0}, {x: 25, y: 25}], // The Polyline
    sockets: [
        {x: 24, y: 5},
        {x: 26, y: 5},
        {x: 24, y: 15},
        {x: 26, y: 15}
    ]
};
```

### Visuals
- **Inactive Lane**: Path is invisible. Sockets are invisible (or "closed"/dormant).
- **Telegraph Phase**:
    - Path glows (faded).
    - Sockets **open up** (play animation / change sprite).
    - Player can now build here.
- **Active Phase**:
    - Path is solid.
    - Sockets remain open.
    - Enemies spawn.

### Logic Changes

#### `GameMap`
- `getLanes()` returns these full objects.
- `isBuildable(x, y)` changes:
    1. Check if tile is SOCKET (geometry).
    2. Check if socket is **Enabled**.
    3. Check if occupied.

#### `EncounterManager`
- Tracks `activeLanes` and `telegraphLanes`.
- When a lane is added to `telegraphLanes`, we **Enable** its sockets in the Map.

## 3. Implementation Plan

1.  **Refactor `map.js`**:
    -   Combine `defineLanes` and `setupTestLevel` (partially).
    -   Define Lanes first.
    -   Place Sockets on the map *based on* the Lane definitions.
2.  **Update `EncounterManager`**:
    -   Explicitly manage Lane State (Inactive -> Telegraphed -> Active).
3.  **Update `Game.js`**:
    -   `tryBuildTower` must check `map.isSocketActive(x, y)`.
4.  **Visuals**:
    -   Draw "Closed" sockets differently (maybe just a small dot or grate).
    -   Draw "Open" sockets as the current box style.

## 4. Why this fits "Blight"
-   **Focus**: The player focuses on the *threat*. You don't build a base; you build a defense for *this specific wave*.
-   **Pacing**: You can't pre-build defenses for later waves (unless they share a lane). You react to the telegraph.
-   **Clarity**: The game tells you exactly where the enemies will come and where you can fight them.
