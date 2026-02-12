# Spec: Game Flow

## ADDED Requirements

### Requirement: State Management

The game loop must be driven by a rigid State Machine to prevent invalid logic execution.

#### Scenario: Playing State
- **GIVEN** the game is in `PLAYING` state
- **THEN** the game loop **MUST** update game entities (Mech, Enemies, Projectiles)
- **AND** the game loop **MUST** check for Win/Loss conditions
- **AND** the game loop **MUST** render the Game World

#### Scenario: Game Over State
- **GIVEN** the game is in `GAME_OVER` state
- **THEN** the game loop **MUST NOT** update game entities
- **AND** the game loop **MUST** render the Game Over overlay
- **AND** the game loop **MUST** listen for Restart Input

### Requirement: Loss Condition

The game must transition to Game Over when the critical failure condition is met.

#### Scenario: Terminal Destruction
- **WHEN** `Terminal.hp` becomes `<= 0`
- **THEN** the game state **MUST** transition to `GAME_OVER`

### Requirement: Game Restart

The player must be able to restart the game after losing.

#### Scenario: Restart Input
- **GIVEN** the game is in `GAME_OVER` state
- **WHEN** the player presses the `R` key
- **THEN** the game state **MUST** transition to `PLAYING`
- **AND** the game entities (Terminal HP, Enemies, Projectiles) **MUST** be reset to their initial values
- **AND** the wave/spawn timers **MUST** be reset
