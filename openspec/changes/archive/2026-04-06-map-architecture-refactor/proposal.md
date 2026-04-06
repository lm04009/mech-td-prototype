## Why

`GameMap` currently contains scene-specific combat setup logic (`setupTestLevel`) called unconditionally from its constructor. Every `GameMap` instance — including the one used by `BaseScene` — runs arena wall placement, water hazard generation, and gate carving, none of which belongs in a hub scene.

The deeper problem is that there is no concept of a map definition. Terrain layout, spawner positions, and interactable positions are all hardcoded either in `GameMap` or directly in the scene that uses it. This makes it impossible to have multiple maps, and it has no path toward a map editor.

Additionally, several files contain leftover stream-of-consciousness comments from prior sessions that add noise without value.

## What Changes

### 1. `GameMap` becomes a pure grid

The constructor allocates only: tile grid (all GROUND), `towers`, `lanes`, `pendingSockets`. No terrain setup. `setupTestLevel()` is deleted.

### 2. Map definitions own their terrain and spawners

Two plain JS objects are introduced:

**`CombatMapDefinition`** (for combat maps):
```js
{
  id: String,
  width: Number,
  height: Number,
  tileSize: Number,
  tiles: [{ x, y, type }],   // sparse — only non-GROUND tiles
  spawners: [{ id, x, y }],  // grid coords; id is string, referenced by encounter system
  terminalPos: { x, y }      // grid coords
}
```

**`HubDefinition`** (for the base):
```js
{
  id: String,
  width: Number,
  height: Number,
  tileSize: Number,
  tiles: [{ x, y, type }],           // sparse — only non-GROUND tiles
  interactables: [{ id, gridX, gridY, radius, name }]
}
```

Both are produced by factory functions for now (same logic as current hardcoded setup, just relocated). When a map editor exists, it replaces the factory with exported tile data directly.

Factory functions live in `src/game/maps/`:
- `src/game/maps/arena1.js` — exports `ARENA_1` (CombatMapDefinition)
- `src/game/maps/hub.js` — exports `HUB` (HubDefinition)

### 3. `generateLanes()` accepts spawner positions from the definition

Currently `generateLanes()` hardcodes 5 spawner positions internally. It is updated to accept spawners as a parameter: `generateLanes(spawners, terminalPos)`. The spawner list comes from the `CombatMapDefinition`.

### 4. Scenes apply their definition

`MapScene.reset()` receives a `CombatMapDefinition`, applies its tile list to a clean `GameMap`, then calls `generateLanes(mapDef.spawners, mapDef.terminalPos)`.

`BaseScene.setupBase()` receives a `HubDefinition`, applies its tile list to a clean `GameMap`, then sets up interactables from `hubDef.interactables`.

### 5. Comment cleanup

Stream-of-consciousness comments are removed from:
- `src/game/map.js` (lines 4–10)
- `src/game/MapScene.js` (lines 362–372)
- `src/engine/AppManager.js` (line 89)
- `src/game/map/LaneGenerator.js` (lines 138–139)

## What Does NOT Change

- The encounter system (`EncounterManager`, `LEVEL_1_ENCOUNTER`, spawner string IDs) is untouched. Spawner IDs remain strings; the encounter still references them by the same strings.
- `LaneGenerator` internal logic is unchanged. Only its input changes (spawner positions passed in rather than hardcoded).
- Socket placement logic is unchanged — sockets are still generated alongside lanes by `LaneGenerator`.
- No new scene types, no class hierarchy.

## Capabilities

### Modified
- `map-grid`: `GameMap` becomes a pure tile grid + spatial query class. No terrain knowledge.
- `scene-management`: Each scene owns its full map configuration via its definition object.

## Impact

- **`src/game/map.js`**: Constructor simplified. `setupTestLevel()` deleted. `generateLanes()` signature changes to accept `(spawners, terminalPos)`.
- **`src/game/MapScene.js`**: Receives and applies `CombatMapDefinition`. Comment noise removed.
- **`src/game/BaseScene.js`**: Receives and applies `HubDefinition`. Room-building loop runs on a clean grid with no prior setup to fight.
- **`src/game/map/LaneGenerator.js`**: Minor comment cleanup.
- **`src/engine/AppManager.js`**: Minor comment cleanup.
- **`src/game/maps/arena1.js`**: New file. Factory function producing `ARENA_1`.
- **`src/game/maps/hub.js`**: New file. Factory function producing `HUB`.
