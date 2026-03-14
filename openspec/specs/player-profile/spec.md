# player-profile Specification

## Requirements

### Requirement: Profile Singleton
A `PlayerProfile` service MUST act as the global source of truth for the player's persistent state across scenes.

#### Scenario: Profile Initialization
- **WHEN** the game boots
- **THEN** a `PlayerProfile` instance MUST be created and passed to scenes
- **AND** it MUST hold the current loadout, credit balance, and unlocked part inventory

### Requirement: Debug All Parts Inventory (Temporary)
For prototype testing purposes, the stash MUST start fully populated.

#### Scenario: Debug Inventory Initialization
- **WHEN** the `PlayerProfile` is instantiated
- **THEN** it MUST automatically load ALL valid part and weapon IDs from `parts.json` and `weapons.json` into its `inventory` arrays.
- **AND** items in `inventory` are conceptually distinct from items currently equipped in `loadout`. A player's total possessions = `inventory` (stash) + `loadout` (currently equipped).
### Requirement: Working Loadout Pattern
The customizable UI MUST NOT directly edit the player's active loadout in the singleton during customization.

#### Scenario: Sandbox Editing
- **WHEN** the `HangarScreen` is opened
- **THEN** it MUST clone the `PlayerProfile.loadout` to use as a temporary working state
- **AND** only overwrite `PlayerProfile.loadout` and `inventory` arrays when the player explicitly clicks "Deploy" or confirms changes.
- **AND** canceling or closing without deploying MUST discard the working state.

### Requirement: Persistent Loadout
The player's mech loadout MUST persist across scenes.

#### Scenario: Mech Loadout Construction
- **WHEN** any scene (Base or Map) creates a `Mech` entity
- **THEN** it MUST use the loadout structured stored in `PlayerProfile.loadout` to look up part and weapon IDs, rather than defaulting to `CONFIG.STARTING_LOADOUT`.
