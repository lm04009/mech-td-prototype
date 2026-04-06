# scene-management Specification

## Requirements

### Requirement: Scene Management Core
The system MUST provide a central application manager capable of housing the Canvas and switching between different logical scenes.

#### Scenario: Switching Scenes
- **WHEN** `AppManager.switchScene(newScene)` is called
- **THEN** the `leave()` method of the current scene (if any) MUST be called
- **AND** the `enter()` method of the new scene MUST be called
- **AND** all subsequent `update(dt)` and `draw()` calls from the `GameLoop` MUST route to the new scene

### Requirement: Scene Engine Dependency Injection
Scenes MUST NOT initialize the engine core components (Canvas, GameLoop, Input) themselves.

#### Scenario: Scene Initialization
- **WHEN** a scene is initialized or entered
- **THEN** it MUST receive a reference to the core engine/app context to access pathfinding, camera, and input data
- **AND** it MUST NOT attach its own DOM event listeners for global keydowns or resizing

### Requirement: Scene Map Ownership

Each scene MUST own its full map configuration by applying a map definition to a clean `GameMap`. No map content MAY be hardcoded in the scene itself.

#### Scenario: Combat Scene Setup
- **WHEN** `MapScene` initializes
- **THEN** it MUST apply a `CombatMapDefinition` to a new `GameMap`
- **AND** it MUST call `generateLanes(mapDef.spawners, mapDef.terminalPos)` after applying tiles
- **AND** it MUST NOT contain hardcoded terrain setup or spawner positions

#### Scenario: Hub Scene Setup
- **WHEN** `BaseScene` initializes
- **THEN** it MUST apply a `HubDefinition` to a new `GameMap`
- **AND** it MUST register interactables from `hubDef.interactables`
- **AND** it MUST NOT contain hardcoded terrain setup or interactable positions

### Requirement: Map Definition Files

Map definitions MUST live in `src/game/maps/` as self-contained files, one per map.

#### Scenario: Definition Location
- **WHEN** a scene needs a map definition
- **THEN** it MUST import it from `src/game/maps/`
- **AND** the definition file MUST NOT import from any scene file
