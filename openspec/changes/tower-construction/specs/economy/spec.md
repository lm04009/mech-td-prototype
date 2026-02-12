# Spec: Economy

## ADDED Requirements

### Requirement: Currency

The player must have sufficient funds to build towers.

#### Scenario: Starting Funds
- **GIVEN** the game starts
- **THEN** the player **MUST** start with a defined amount of Credits (e.g., 500)

#### Scenario: Insufficient Funds
- **GIVEN** a Tower costs 100 Credits
- **AND** the player has 50 Credits
- **THEN** the player **MUST NOT** be able to place the tower
- **AND** the UI should indicate insufficient funds

### Requirement: Income

Killing enemies rewards credits.

#### Scenario: Enemy Kill
- **WHEN** an enemy is destroyed (HP <= 0)
- **THEN** the player's Credits **MUST** increase by the Enemy's bounty value
