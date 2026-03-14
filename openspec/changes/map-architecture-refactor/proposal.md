## Why

`GameMap` currently contains scene-specific combat setup logic (`setupTestLevel`) that is called unconditionally from its constructor. This means every `GameMap` instance — including the one used by `BaseScene` for the hub area — runs arena wall placement, water hazard generation, gate carving, and full lane generation via `LaneGenerator`, even though none of that is relevant to the base scene.

This was discovered when `LaneGenerator` logs appeared in the console during hub navigation. The immediate symptom was patched by moving the `generateLanes` call out of `setupTestLevel` and into `MapScene.enter()`, but the underlying design problem remains: `GameMap` is a generic tile grid that should know nothing about combat arenas or lanes.

## What Changes

- Strip `GameMap` of all scene-specific initialization. The constructor should only allocate the tile grid, `towers` array, `lanes` object, and `pendingSockets` queue. No terrain setup, no lane generation.
- Move arena setup logic (inner ring walls, gates, water hazards) into `MapScene` as an explicit `setupCombatTerrain()` step called during `enter()`.
- Move lane generation into `MapScene.enter()` (already partially done — this formalizes it).
- `BaseScene` sets up its own closed room terrain directly, as it already does — but now without fighting against a `setupTestLevel` that ran first.

## Capabilities

### Modified Capabilities
- `map-grid`: Remove the implicit terrain initialization contract from `GameMap`. The class becomes a pure data container (tile grid + spatial queries). Scene-specific setup is explicitly owned by the scene.
- `scene-management`: `MapScene` and `BaseScene` each own their full map configuration. No shared implicit setup.

## Impact

- **`GameMap`**: Constructor shrinks significantly. `setupTestLevel` is deleted.
- **`MapScene`**: Gains explicit terrain + lane setup calls in `enter()`. No behavior change, just explicit ownership.
- **`BaseScene`**: No longer silently fighting a prior `setupTestLevel` pass. Its room-building loop now runs on a clean grid.
- **Test/debug**: Console is no longer polluted with LaneGenerator logs during hub navigation.
