# Spec: Weapon Ranges & Mounting

## ADDED Requirements

### Requirement: Explicit Ranges

Weapons are defined primarily by their range category, which MUST be strictly enforced.

#### Scenario: Range Categories
- **WHEN** a weapon is defined
- **THEN** it MUST belong to one of three categories: Long Range, Medium Range, or Melee

#### Scenario: Range Enforcement
- **WHEN** the player attempts to fire a weapon
- **AND** the target is outside the weapon's defined range
- **THEN** the weapon MUST NOT fire

#### Scenario: Visual Feedback
- **WHEN** the player is active
- **THEN** weapon ranges MUST be visually represented (e.g. range overlays)

### Requirement: Mounting Rules

Weapons MUST be attached to specific arms and operate independently.

#### Scenario: Single Mount
- **WHEN** equipping a mech
- **THEN** only one weapon can be mounted per arm (Left/Right)

#### Scenario: Independent Fire
- **WHEN** firing
- **THEN** the Left Arm and Right Arm weapons MUST be triggered independently
