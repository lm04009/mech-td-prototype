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
