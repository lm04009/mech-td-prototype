# pause-screen Specification

## Purpose
TBD - created by archiving change add-pause-screen. Update Purpose after archive.
## Requirements
### Requirement: Pause Screen Overlay
The system SHALL display a visual DOM-based overlay to indicate the PAUSED state.

#### Scenario: Entering Pause state
- **WHEN** the game transitions to PAUSED state
- **THEN** the Pause Screen overlay becomes visible.

#### Scenario: Exiting Pause state
- **WHEN** the game transitions from PAUSED state to PLAYING state
- **THEN** the Pause Screen overlay is hidden.

### Requirement: Game Freezing
The system SHALL freeze all entity updates and game operations while in the PAUSED state.

#### Scenario: Paused game update loop
- **WHEN** the game is in the PAUSED state
- **THEN** core logic iterations (mech movement, tower firing, enemy pathfinding, encounter spawns) are skipped.
- **AND** the game continues rendering the last valid frame of the map transparently underneath the Pause overlay.

### Requirement: Escape Interaction
The system SHALL map the `Escape` key to toggle the `PAUSED` and `PLAYING` states.

#### Scenario: Pausing during active gameplay
- **WHEN** the user presses `Escape` while in the `PLAYING` state
- **THEN** the game transitions to the `PAUSED` state.

#### Scenario: Unpausing during active pause
- **WHEN** the user presses `Escape` while in the `PAUSED` state
- **THEN** the game transitions to the `PLAYING` state.

#### Scenario: Ignoring Escape outside PLAYING or PAUSED
- **WHEN** the user presses `Escape` while in `GAME_OVER` or `GAME_WIN` states
- **THEN** no state transition occurs.

