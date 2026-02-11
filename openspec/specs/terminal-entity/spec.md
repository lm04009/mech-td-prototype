# terminal-entity Specification

## Purpose
TBD - created by archiving change terminal-objective. Update Purpose after archive.
## Requirements
### Requirement: Terminal Entity

The Terminal MUST be a stationary entity located at the center of the game world.

#### Scenario: Initialization
- **WHEN** the game starts
- **THEN** the Terminal MUST be spawned at the map center
- **AND** it MUST be visually distinct

### Requirement: Terminal Health

The Terminal MUST have a health value that can be reduced.

#### Scenario: Taking Damage
- **WHEN** the Terminal takes damage (e.g. from debug command)
- **THEN** its HP MUST decrease
- **AND** the current HP MUST be visible (e.g. valid debug log or UI)

#### Scenario: Destruction
- **WHEN** Terminal HP <= 0
- **THEN** the Game Over state MUST be triggered (refer to `win-loss` spec)

