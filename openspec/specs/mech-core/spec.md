# mech-core Specification

## Purpose
Defines the Mech's internal structure — parts, weapon slots, input bindings, stat derivation, and functional consequences of part destruction.

## Requirements

### Requirement: Mech Parts Structure

The mech MUST be composed of discrete parts, each with independent HP, rather than a single health pool.

#### Scenario: Part Definition
- **WHEN** a mech is instantiated
- **THEN** it MUST have exactly four tracked parts: Body, Left Arm, Right Arm, and Legs.
- **AND** each part MUST track its own current HP, max HP, Defense value, and AccuracyRatio.
- **AND** all values MUST come from `parts.json` data, not hardcoded constants.

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
- **THEN** ALL weapon slots assigned to that arm (both Grip and Shoulder) become unusable.
- **AND** their range rings MUST stop being rendered.

### Requirement: Four Weapon Slots

The Mech MUST support exactly four distinct weapon slots: Left Arm Grip, Left Arm Shoulder, Right Arm Grip, and Right Arm Shoulder.

#### Scenario: Slot structure at instantiation
- **WHEN** a Mech is instantiated
- **THEN** it MUST have slots: `armLeft.grip`, `armLeft.shoulder`, `armRight.grip`, `armRight.shoulder`
- **AND** each slot independently tracks its weapon data and current cooldown

#### Scenario: Fixed starting loadout from data
- **WHEN** the game starts (pre-customization UI)
- **THEN** the Mech is initialized with a fixed preset loaded from `weapons.json` and `parts.json`
- **AND** the preset must be defined in a configuration constant, not scattered inline

### Requirement: Weapon Slot Input Bindings

Each weapon slot MUST be triggered by a distinct, fixed player input.

#### Scenario: Input-to-slot mapping
- **WHEN** the player presses the assigned input:
  - Right Mouse Button → fires `armLeft.grip`
  - Key `1` → fires `armRight.grip`
  - Key `2` → fires `armLeft.shoulder`
  - Key `3` → fires `armRight.shoulder`
- **THEN** only that specific slot attempts to fire
- **AND** each slot's cooldown timer is independent
- **AND** weapon key inputs (RMB, 1, 2, 3) MUST NOT be suppressed when the cursor hovers a buildable socket tile — building is LMB-only and weapon fire must remain available at all times

### Requirement: Data-Driven Mech Initialization

The Mech MUST derive all stat values (HP, Defense, AccuracyRatio, PowerOutput, Weight, MovementSpeedMod) from `parts.json` and `weapons.json`. No hardcoded stat values are permitted.

#### Scenario: Mech instantiation from data
- **WHEN** a Mech is created with a loadout configuration
- **THEN** `TotalWeight = Weight_Body + Weight_ArmL + Weight_ArmR + Weight_Legs + sum(Weight_Weapons)`
- **AND** `TotalPowerOutput = PowerOutput_Body + PowerOutput_Legs`
- **AND** `MoveEfficiency = max(5000, 10000 - floor(max(0, (TotalWeight * 10000 / TotalPowerOutput) - 7000) * 5 / 3))`
- **AND** `ActualSpeed = floor(EntityBaseSpeed * MoveEfficiency / 10000)`

### Requirement: Evasion Derived from Weight/Power Ratio

The Mech's evasion (used in enemy `ChanceToHit` rolls) MUST be calculated from its weight and power stats.

#### Scenario: Evasion calculation
- **WHEN** an enemy attempts to hit the Mech
- **THEN** `Evasion = max(0, min(10000, 10000 - floor(max(0, (TotalWeight * 10000 / TotalPowerOutput) - 3000) * 10 / 7)))`
- **AND** this value is passed to `CombatSystem.calcChanceToHit()` as the defender's evasion
