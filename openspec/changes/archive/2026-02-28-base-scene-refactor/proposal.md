## Why

The current architecture houses all game state, engine initialization, and combat logic within a single monolithic `Game.js` file. This prevents the implementation of a persistent "Base" or "Hideout" area where players can customize their mechs and select missions without being in active combat. To support the planned Hangar UI and Map Device functionalities, we need to separate the core engine from the specific scene logic.

## What Changes

- Extract the core engine infrastructure (Canvas, GameLoop, Input, Camera, Pathfinding) out of `Game` and into a reusable architecture.
- Create a `PlayerProfile` to persist the player's mech loadout, credits, and unlocked inventory across different scenes.
- Refactor the existing `Game.js` into a specialized `MapScene` that handles only the tower defense combat loop.
- Introduce a new `BaseScene` representing a physical, navigable hub area with non-hostile interactable entities (e.g., a Map Device).
- Implement transition logic to switch between the BaseScene and the MapScene.

## Capabilities

### New Capabilities
- `scene-management`: Defines how scenes (Base, Map) are loaded, updated, and transitioned by a central AppManager or Engine core.
- `player-profile`: Defines the persistent data structure for the player's inventory, loadout, and progression state.
- `base-hub`: Defines the physical layout and interactable entities within the non-combat Base scene (including the Map Device interaction).

### Modified Capabilities
- `mech-core`: The mech's loadout must now be initialized dynamically from the `player-profile` rather than a hardcoded `CONFIG.STARTING_LOADOUT`.

## Impact

- **Core Architecture:** `src/main.js` will need to initialize the overarching Engine/AppManager instead of directly creating `Game.js`.
- **Combat Loop:** `Game.js` will be heavily refactored (likely renamed to `MapScene.js`), stripping out generic engine setup and focusing solely on combat/encounter logic.
- **Data Flow:** The `DataStore` and dynamic stats calculations must be cleanly accessible by the new profile system to calculate mech stats persistently.
- **UI:** Existing UI components (`HUD`, `Screens`) may need adjustments to receive events from the current active scene rather than a single global `Game` instance.
