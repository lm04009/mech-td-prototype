# player-profile Specification

## Requirements

### Requirement: Profile Singleton
A `PlayerProfile` service MUST act as the global source of truth for the player's persistent state across scenes.

#### Scenario: Profile Initialization
- **WHEN** the game boots
- **THEN** a `PlayerProfile` instance MUST be created and passed to scenes
- **AND** it MUST hold the current loadout, credit balance, and unlocked part inventory

### Requirement: Persistent Credits
Credits MUST persist safely between scenes.

#### Scenario: Earning from Maps
- **WHEN** a map encounters ends in victory
- **THEN** any credits earned during that map run MUST be added to the `PlayerProfile` total balance
- **AND** the `BaseScene` MUST display this updated balance

### Requirement: Persistent Loadout
The player's mech loadout MUST persist across scenes.

#### Scenario: Mech Loadout Construction
- **WHEN** any scene (Base or Map) creates a `Mech` entity
- **THEN** it MUST use the loadout structured stored in `PlayerProfile.loadout` to look up part and weapon IDs, rather than defaulting to `CONFIG.STARTING_LOADOUT`.
