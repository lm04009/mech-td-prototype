# Delta Spec: weapon-ranges (combat-foundation)

## MODIFIED Requirements

### Requirement: Explicit Ranges

Weapons are defined primarily by their range category, which MUST be strictly enforced.

#### Scenario: Range Categories
- **WHEN** a weapon is defined
- **THEN** it MUST belong to one of three categories: Long Range, Medium Range, or Melee
- **AND** the numeric range value in tiles is defined by `RangeMax` in `weapons.json`

#### Scenario: Range Enforcement
- **WHEN** the player attempts to fire a weapon slot
- **AND** the cursor target is outside the weapon's `RangeMax` distance (in world pixels)
- **THEN** that slot MUST NOT fire

#### Scenario: Visual Feedback — All Slots Simultaneously
- **WHEN** the Mech is active and at least one weapon slot is equipped
- **THEN** ALL equipped, functional weapon slot range rings MUST be rendered simultaneously
- **AND** each ring MUST be visually distinct (color or style) to allow the player to identify which ring belongs to which slot
- **AND** a destroyed arm's slots MUST NOT render range rings

### Requirement: Mounting Rules

Weapons MUST be attached to specific arm slots and operate independently.

#### Scenario: Slot Definition
- **WHEN** equipping a mech
- **THEN** each arm (Left, Right) has exactly two slots: Grip and Shoulder
- **AND** each slot holds at most one weapon

#### Scenario: Independent Fire
- **WHEN** firing
- **THEN** each slot fires independently based on its own cooldown timer
- **AND** firing one slot does NOT affect any other slot's cooldown

## ADDED Requirements

### Requirement: Range in World Pixels

Weapon range values from `weapons.json` (`RangeMax`) are expressed in tiles. They MUST be converted to world pixels for all game logic and rendering.

#### Scenario: Range unit conversion
- **WHEN** a weapon's range is used for fire checks or ring rendering
- **THEN** `rangePixels = RangeMax * TILE_SIZE`
- **AND** this conversion is applied consistently in both the fire gate check and the visual ring radius
