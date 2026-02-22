# combat Specification

## Purpose
Defines the rules by which damage is targeted, mitigated, and distributed across the entity's parts.

## Requirements

### Requirement: Weighted Target Selection

Damage MUST NOT be applied generally, but instead must target a specific part based on a weighted distribution.

#### Scenario: Incoming hit calculation
- **WHEN** a projectile successfully strikes the Mech's collider
- **THEN** the targeted part is determined via RNG using a 1:2:2:3 weight ratio (Body: 1, Left Arm: 2, Right Arm: 2, Legs: 3).

### Requirement: Hit Target Reroll

If a destroyed part is selected as a target by an attack, the target MUST be re-selected uniformly from among all remaining non-destroyed parts.

#### Scenario: Hit on destroyed part
- **WHEN** a projectile rolls a hit against a part that already has 0 HP
- **THEN** the attack target is re-selected from a pool of parts with > 0 HP
- **AND** each valid part in that pool is given an equal weight of 1
- **AND** the damage multiplier uses the newly selected part's defense.
