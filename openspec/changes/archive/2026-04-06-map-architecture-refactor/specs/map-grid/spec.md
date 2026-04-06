## MODIFIED Requirements

### Requirement: Grid System

The game world MUST be represented by a tile-based grid.

`GameMap` MUST be a pure data container: it allocates the tile grid, `towers` array, `lanes` object, and `pendingSockets` queue. It MUST NOT contain any terrain setup logic, scene-specific initialization, or hardcoded map content.

#### Scenario: Map Initialization
- **WHEN** `new GameMap(width, height, tileSize)` is called
- **THEN** it MUST allocate a 2D tile grid initialized to `TERRAIN.GROUND`
- **AND** it MUST initialize `towers`, `lanes`, and `pendingSockets`
- **AND** it MUST NOT apply any terrain setup or call any setup function

## ADDED Requirements

### Requirement: Map Definition

All map content MUST be defined in a map definition object external to `GameMap` and external to the scene.

#### Scenario: Combat Map Definition
- **WHEN** a combat map is loaded
- **THEN** a `CombatMapDefinition` object MUST provide: `id`, `width`, `height`, `tileSize`, `tiles` (sparse array of non-GROUND tile overrides), `spawners` (array of `{ id, x, y }` in grid coords), and `terminalPos` (`{ x, y }` in grid coords)

#### Scenario: Hub Definition
- **WHEN** the hub map is loaded
- **THEN** a `HubDefinition` object MUST provide: `id`, `width`, `height`, `tileSize`, `tiles` (sparse array of non-GROUND tile overrides), and `interactables` (array of `{ id, name, gridX, gridY, radius }`)

#### Scenario: Tile Application
- **WHEN** a scene applies a map definition to a `GameMap`
- **THEN** it MUST call `map.setTile(t.x, t.y, t.type)` for each entry in `definition.tiles`
- **AND** tiles not listed in `definition.tiles` MUST remain `TERRAIN.GROUND`

### Requirement: Lane Generation Input

Lane generation MUST derive spawner positions from the map definition, not from hardcoded values.

#### Scenario: Spawner Input
- **WHEN** `GameMap.generateLanes(spawners, terminalPos)` is called
- **THEN** it MUST use the provided `spawners` array for lane origin positions
- **AND** it MUST use the provided `terminalPos` as the lane destination
- **AND** it MUST NOT contain any hardcoded spawner coordinates

#### Scenario: Missing Lane Warning
- **WHEN** a spawner from the definition produces no valid lane path
- **THEN** `generateLanes` MUST log a warning identifying the spawner id
