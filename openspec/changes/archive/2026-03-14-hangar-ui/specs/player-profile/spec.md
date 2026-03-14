## ADDED Requirements

### Requirement: Working Loadout Pattern
The customizable UI MUST NOT directly edit the player's active loadout in the singleton during customization.

#### Scenario: Sandbox Editing
- **WHEN** the `HangarScreen` is opened
- **THEN** it MUST clone the `PlayerProfile.loadout` to use as a temporary working state
- **AND** only overwrite `PlayerProfile.loadout` and `inventory` arrays when the player explicitly clicks "Deploy" or confirms changes.
- **AND** canceling or closing without deploying MUST discard the working state.
