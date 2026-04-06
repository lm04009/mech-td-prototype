## 1. Create Map Definition Files

- [x] 1.1 Create `src/game/maps/arena1.js` — factory function that produces `ARENA_1` (`CombatMapDefinition`) with the same terrain logic currently in `GameMap.setupTestLevel()`: inner ring walls, gates, water hazards. Spawners: the 5 positions currently hardcoded in `generateLanes()`. `terminalPos`: map center.
- [x] 1.2 Create `src/game/maps/hub.js` — factory function that produces `HUB` (`HubDefinition`) with the same room-building logic currently in `BaseScene.setupBase()`. Interactables: hangar console and map device with their current positions and radii.

## 2. Refactor GameMap

- [x] 2.1 Remove `this.setupTestLevel()` call from `GameMap` constructor.
- [x] 2.2 Delete `GameMap.setupTestLevel()` method entirely.
- [x] 2.3 Update `GameMap.generateLanes(spawners, terminalPos)` signature — replace hardcoded spawner array and center calculation with the provided parameters.
- [x] 2.4 Add warning log in `generateLanes()` when a spawner produces no valid lane path (log the spawner `id`).
- [x] 2.5 Remove stream-of-consciousness comments from `src/game/map.js` lines 4–10.

## 3. Refactor MapScene

- [x] 3.1 Import `ARENA_1` from `src/game/maps/arena1.js`.
- [x] 3.2 In `MapScene.reset()`: after `new GameMap(...)`, apply `ARENA_1.tiles` via `map.setTile()`, then call `map.generateLanes(ARENA_1.spawners, ARENA_1.terminalPos)`.
- [x] 3.3 Remove stream-of-consciousness comments from `MapScene.js` lines 362–372.

## 4. Refactor BaseScene

- [x] 4.1 Import `HUB` from `src/game/maps/hub.js`.
- [x] 4.2 In `BaseScene.setupBase()`: after `new GameMap(...)`, apply `HUB.tiles` via `map.setTile()`. Remove the existing inline room-building loop.
- [x] 4.3 Replace hardcoded interactable position calculations in `setupBase()` with values from `HUB.interactables`.

## 5. Cleanup

- [x] 5.1 Remove stale comment from `src/engine/AppManager.js` line 89 (`// Wait, maybe the app manager clears it?`).
- [x] 5.2 Remove stream-of-consciousness comments from `src/game/map/LaneGenerator.js` lines 138–139.

## 6. Verification

- [x] 6.1 Launch the game. Confirm `BaseScene` loads with no `LaneGenerator` logs in the console.
- [x] 6.2 Interact with the Map Device to transition to `MapScene`. Confirm the combat arena renders correctly (walls, gates, water hazards visible).
- [x] 6.3 Confirm lanes generate and are visible. Confirm sockets appear along lanes.
- [x] 6.4 Confirm enemies spawn and follow lane paths to the terminal.
- [x] 6.5 Confirm the hangar interactable in `BaseScene` still opens the Hangar UI.
- [x] 6.6 Confirm no hardcoded spawner positions, terrain setup, or interactable positions remain in `GameMap`, `MapScene`, or `BaseScene`.
