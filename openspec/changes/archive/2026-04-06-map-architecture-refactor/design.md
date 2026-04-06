## Context

`GameMap` currently calls `setupTestLevel()` in its constructor, unconditionally running arena wall placement, gate carving, and water hazard setup for every map instance — including the hub. There is no concept of a map definition: terrain layout, spawner positions, and interactable positions are all hardcoded either in `GameMap` or directly in the scene that uses them.

The game will eventually support multiple player-selectable combat maps and a map editor. The current design has no path to either. This refactor establishes the foundational layer: a `GameMap` that is a pure grid, and map definitions that own their own content.

## Goals / Non-Goals

**Goals:**
- `GameMap` constructor allocates only: tile grid, `towers`, `lanes`, `pendingSockets`. No terrain knowledge.
- Map content (terrain, spawner positions, terminal position, interactable positions) lives in definition objects external to `GameMap` and the scenes.
- `LaneGenerator` accepts spawner positions as input rather than hardcoding them.
- Each scene applies its definition to a clean grid.
- All leftover stream-of-consciousness comments are removed.

**Non-Goals:**
- Encounter system is not touched. `EncounterManager`, `LEVEL_1_ENCOUNTER`, and spawner string IDs remain as-is.
- No map selection UI or map registry.
- No map editor.
- No changes to `LaneGenerator` internals, socket placement logic, or pathfinding.
- No changes to `InputHandler` keydown handling or scene-management spec violations.

## Decisions

### Decision 1: Factory functions as the tile data placeholder

**Choice:** Each map definition file exports a plain JS object produced by a factory function. The factory contains the same terrain-building logic currently in `setupTestLevel()` or `BaseScene.setupBase()`, relocated to the definition file.

**Why not a static 2D tile array?** A 50×50 grid is 2500 entries. Maintaining that by hand is error-prone and unreadable. A factory function is compact, readable, and produces the same sparse `[{x, y, type}]` output that a future editor would export.

**Why not keep the logic in the scene?** The scene is a runtime controller, not a data source. Putting terrain logic in the scene means every new map requires modifying the scene class. A definition file is self-contained and replaceable.

**Exit strategy:** When an editor exists, it replaces the factory function with exported tile data directly. The definition shape doesn't change.

### Decision 2: Separate definition shapes for combat maps and the hub

**Choice:** `CombatMapDefinition` has `tiles`, `spawners`, `terminalPos`. `HubDefinition` has `tiles`, `interactables`. They are different plain JS objects, not subclasses of a shared base.

**Why not a shared base type?** A hub has no spawners or terminal. A combat map has no interactables. Forcing a shared shape adds empty fields and implies a relationship that doesn't exist. Plain objects with different shapes are honest.

**Why no class validation?** In plain JavaScript, a factory function that constructs and returns the object is sufficient for catching malformed definitions at load time. A class adds no meaningful benefit over a well-written factory.

### Decision 3: Spawner positions move into `CombatMapDefinition`; `generateLanes()` signature changes

**Choice:** `GameMap.generateLanes(spawners, terminalPos)` accepts spawner data from the definition. `LaneGenerator` internals are unchanged.

**Current state:** `generateLanes()` hardcodes 5 spawner positions and the center as the target. These are replaced by the parameters.

**Spawner ID format:** String IDs are retained (`'NORTH'`, `'WEST'`, etc.) because the encounter system references them by these strings. Changing the ID format is out of scope.

### Decision 4: Definition files live in `src/game/maps/`

**Choice:** New directory `src/game/maps/` holds one file per map: `arena1.js` and `hub.js`.

**Why a dedicated directory?** Maps will grow in number. Keeping them alongside scene and engine files creates clutter. A `maps/` directory is the natural home and the obvious target for editor output.

## Risks / Trade-offs

**Deterministic lane generation** → Sockets always appear in the same positions because spawner positions are fixed in the definition and the terrain never varies. This is a known limitation of the prototype stage. Addressed when procedural terrain or randomized spawner placement is introduced.

**String spawner IDs are fragile** → A typo in the encounter config or definition silently produces no lane. Mitigation: `generateLanes()` logs a warning if a spawner ID from the definition produces no lane.

**Factory functions are still code, not data** → The tile layout can't be read or edited without running the code. Accepted trade-off until an editor exists.

## Open Questions

- Spawner ID scheme (numeric vs string) is deferred. String IDs are retained for now but will need revisiting when the encounter system is redesigned.
- `HubDefinition` interactable positions are currently hardcoded as offsets from map center. When the hub layout grows more complex, these should also come from a definition rather than being computed inline.
