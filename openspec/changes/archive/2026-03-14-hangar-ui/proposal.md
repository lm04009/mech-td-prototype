## Why

Currently, the player profile manages a loadout and an inventory, and the Base Scene has a conceptual Hangar Console, but no actual UI exists for players to customize their mech. We need a dedicated Hangar UI that allows players to visualize their mech, swap equipped parts with items from their inventory, and clearly evaluate the stat changes and deployment legality (specifically weight vs. power constraints) of their choices.

## What Changes

- Implement a DOM-based `HangarScreen` component that integrates with `UIManager.js`.
- Connect the `BaseScene` Hangar Console entity so that an LMB click emits an event to open the `Hangar UI`.
- Display a two-column functional layout:
  - **Left Side**: Visual preview of the currently equipped mech and a high-level overview of the current loadout.
  - **Right Side**: Selectable loadout slots that filter the inventory stash, displaying available replacement parts.
  - **Real-Time Data Panel**: A panel comparing the stats of the current part vs. the selected stash part, and the overall projected mech stats (Max HP, Speed %, Evasion) using formulas from `mech-core/spec`.
  - **Capacity Display**: Shows the `Weight / Total Power Output` ratio to explicitly communicate deployment viability.
- Enforce strict deployment constraints:
  - The mech must have all 4 core parts (Body, Left Arm, Right Arm, Legs) equipped.
  - The mech must have at least 1 weapon equipped.
  - The mech's Total Weight must be $\le$ Total Power Output.
- Provide a "Deploy/Close" action that persists the updated loadout to the `PlayerProfile` and resumes the Base Scene.

## Capabilities

### New Capabilities
- `hangar-ui`: Defines the visual layout, interaction flows, and constraints enforcement for the mech customization screen.

### Modified Capabilities
- `base-hub`: Update to formally connect the physical Hangar Console entity interactions to the UI.
- `player-profile`: Refine how the UI reads from and writes to the `loadout` and `inventory` state during the customization process.

## Impact

- **UI Layer**: Adds a complex new screen to the existing `UIManager` structure, requiring detailed DOM manipulation and styling.
- **Game State**: `PlayerProfile` will receive frequent read/write operations during UI interactions.
- **Base Scene**: Will need to pause player movement and interactions while the overlay is active.
