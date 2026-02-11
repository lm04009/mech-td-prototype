# Spec: Mech Core

## ADDED Requirements

### Requirement: Mech Parts Structure

The mech is composed of discrete parts, each with independent HP, rather than a single health pool.

#### Scenario: Part Definition
- **WHEN** a mech is instantiated
- **THEN** it must have exactly four parts: Torso (core), Legs, Left Arm, Right Arm
- **AND** each part must track its own current and max HP

### Requirement: Damage Consequences

Damage to specific parts results in immediate functional loss, not just stat reduction.

#### Scenario: Torso Destruction
- **WHEN** the Torso part's HP reaches 0
- **THEN** the player is defeated (Game Over)

#### Scenario: Leg Destruction
- **WHEN** the Legs part's HP reaches 0
- **THEN** movement is disabled (or significantly impaired)

#### Scenario: Arm Destruction
- **WHEN** an Arm part's HP reaches 0
- **THEN** all weapons mounted on that specific arm become unusable
