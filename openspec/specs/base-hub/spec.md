# base-hub Specification

## Requirements

### Requirement: Non-Combat Environment
The BaseScene MUST provide a safe, navigable physical environment using the core engine grid and renderer.

#### Scenario: Entering BaseScene
- **WHEN** BaseScene is the active scene
- **THEN** the camera MUST follow the player Mech
- **AND** click-to-move pathfinding MUST function correctly
- **AND** weapon firing/cooldowns MUST be disabled
- **AND** the `EncounterManager` MUST not be active (no waves or enemy spawning).

### Requirement: Interactable Stations
The BaseScene MUST support interactable entities that act as UI triggers.

#### Scenario: Approaching a Station
- **WHEN** the player walks the Mech within a specified pixel radius of an interactive entity (like the Map Device or Hangar Console)
- **THEN** an interaction prompt (e.g., "Press [KEY] or Click to Interact") MUST become visible
- **AND** interaction MUST emit an event via `EventBus` to notify the UIManager to open the respective DOM overlay.
