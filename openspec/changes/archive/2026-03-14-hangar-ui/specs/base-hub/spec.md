## MODIFIED Requirements

### Requirement: Interactable Stations
The BaseScene MUST support interactable entities that act as UI triggers.

#### Scenario: Approaching a Station
- **WHEN** the player walks the Mech within a specified pixel radius of an interactive entity (like the Map Device or Hangar Console)
- **THEN** an interaction prompt (e.g., "Left Click to Interact") MUST become visible
- **AND** a Left Mouse Button (LMB) click on the entity MUST emit an event via `EventBus` to notify the UIManager to open the respective DOM overlay.
- **AND** opening an overlay MUST freeze the player's movement and block clicks on other BaseScene elements.
