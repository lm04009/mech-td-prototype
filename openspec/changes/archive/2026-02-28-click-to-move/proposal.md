## Why

WASD keyboard movement is a placeholder that contradicts the intended game feel. The mech is an actively-piloted combat unit that must reposition intelligently around terrain, enemies, and towers — mouse-driven click-to-move (PoE Blight style) is the correct control model for this.

## What Changes

- Remove WASD movement entirely from `Input.js` and `Mech.js`
- Add LMB click-to-move: left mouse button on open ground sets a movement destination
- Add A* pathfinder (8-directional, mech-aware walkability) as a new engine utility
- Add re-path throttle: ~100ms cooldown while LMB held, immediate on new press
- Add BFS nearest-walkable snap for unreachable destinations (silent, no error state)
- Add PoE-style click ring visual feedback (brief expand+fade ring at click point)
- Add `isWalkableFor(gx, gy, legsData)` to `GameMap` — walkability is mech-state-aware
- LMB on socket continues to build towers (existing behavior, already disambiguated)
- Mech continues to face the mouse cursor at all times (unchanged)

## Capabilities

### New Capabilities
- `click-to-move`: LMB-driven pathfinding movement for the player mech, including A* pathfinder, re-path throttle, BFS fallback, and click ring visual

### Modified Capabilities
- `mech-core`: Movement input model changes from WASD vector to waypoint-following. Legs penalty still applies. Walkability is now mech-state-dependent (enables future hover legs).
- `mech-movement`: Full replacement — movement spec changes from keyboard to click-to-move model.

## Impact

- `src/engine/Input.js` — remove WASD key tracking and `getMovementVector()`
- `src/game/mech.js` — replace `inputVector` movement with waypoint-follower
- `src/game/map.js` — add `isWalkableFor(gx, gy, legsData)` method
- `src/game/Game.js` — wire LMB click → pathfind, suppress during socket hover
- New file: `src/engine/Pathfinder.js` — standalone A* + BFS snap utility
