# Spec: Win/Lose Conditions

## ADDED Requirements

### Requirement: Lose Conditions

The game MUST end in a loss if the player dies OR the objective is destroyed.

#### Scenario: Mech Destruction
- **WHEN** the Mech's Torso HP reaches 0
- **THEN** the game MUST end in DEFEAT

#### Scenario: Terminal Destruction
- **WHEN** the defended Terminal's HP reaches 0
- **THEN** the game MUST end in DEFEAT

### Requirement: Win Condition

The game MUST end in a win if the player survives the wave.

#### Scenario: Wave Survival
- **WHEN** the wave duration completes (or all enemies are defeated)
- **AND** the Terminal is still intact (HP > 0)
- **AND** the Mech Torso is still intact (HP > 0)
- **THEN** the game MUST end in VICTORY
