## MODIFIED Requirements

### Requirement: Mech Parts Structure

The mech MUST be composed of discrete parts, each with independent HP, rather than a single health pool.

#### Scenario: Part Definition
- **WHEN** a mech is instantiated
- **THEN** it MUST have exactly four tracked parts: Body, Left Arm, Right Arm, and Legs.
- **AND** each part MUST track its own current HP, max HP, and Defense value.

### Requirement: Damage Consequences

Damage to specific parts MUST result in immediate functional loss, not just stat reduction.

#### Scenario: Body Destruction
- **WHEN** the Body part's HP reaches 0
- **THEN** the player is defeated (Game Over)

#### Scenario: Leg Destruction
- **WHEN** the Legs part's HP reaches 0
- **THEN** movement is impaired, and a `DestroyedSpeedModifier` multiplier of `5000 / 10000` MUST be applied to the Mech's actual movement speed.

#### Scenario: Arm Destruction
- **WHEN** an Arm part's HP reaches 0
- **THEN** all Grip and Shoulder weapons assigned to that specific arm become unusable.
