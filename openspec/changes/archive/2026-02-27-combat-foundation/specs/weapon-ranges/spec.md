# Delta Spec: weapon-ranges (combat-foundation)

## MODIFIED Requirements

### Requirement: Explicit Ranges

Weapons are defined primarily by their range properties, which MUST be enforced for minimum range only. Maximum range is enforced by projectile travel distance, not by a fire gate.

#### Scenario: Range Categories
- **WHEN** a weapon is defined
- **THEN** it MUST belong to one of three categories: Long Range, Medium Range, or Melee
- **AND** the numeric range value in tiles is defined by `RangeMax` in `weapons.json`

#### Scenario: Maximum Range Enforcement
- **WHEN** a player fires a weapon
- **THEN** the weapon fires in the aimed direction regardless of how far the cursor is from the mech
- **AND** the spawned projectile travels at most `RangeMax * TILE_SIZE` pixels before expiring
- **AND** the range ring shows the effective reach of the projectile, not a fire gate

#### Scenario: Minimum Range Dead Zone (Shoulder Weapons)
- **WHEN** the player attempts to fire a weapon with `RangeMin > 1`
- **AND** the cursor's aim point is closer than `RangeMin * TILE_SIZE` pixels from the barrel
- **THEN** that slot MUST NOT fire
- **AND** the dashed inner ring on the range display shows the dead zone boundary

#### Scenario: Visual Feedback — All Slots Simultaneously
- **WHEN** the Mech is active and at least one weapon slot is equipped
- **THEN** ALL equipped, functional weapon slot range rings MUST be rendered simultaneously
- **AND** each ring MUST be visually distinct (color or style) to allow the player to identify which ring belongs to which slot
- **AND** a destroyed arm's slots MUST NOT render range rings
- **AND** weapons with `RangeMin > 1` render an additional dashed inner ring at `RangeMin * TILE_SIZE` radius

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

#### Scenario: Input is never suppressed by map interaction
- **WHEN** the player hovers the cursor over a buildable socket tile
- **THEN** weapon key inputs (RMB, 1, 2, 3) MUST NOT be suppressed
- **AND** only LMB (building/placement) interacts with sockets

## ADDED Requirements

### Requirement: Range in World Pixels

Weapon range values from `weapons.json` (`RangeMax`, `RangeMin`) are expressed in tiles. They MUST be converted to world pixels for all game logic and rendering.

#### Scenario: Range unit conversion
- **WHEN** a weapon's range is used for projectile lifetime or ring rendering
- **THEN** `rangePixels = RangeMax * TILE_SIZE`
- **AND** `minRangePixels = RangeMin * TILE_SIZE`
- **AND** these conversions are applied consistently in both the fire gate check and the visual ring radius

### Requirement: Shoulder Weapon Ballistic Delivery

Shoulder-mounted weapons (e.g., Missile Launchers) fire projectiles in a ballistic arc — launched upward above the battlefield and descending onto the target. This is distinct from grip weapons which fire flat along the ground.

#### Scenario: Ballistic projectile — terrain bypass
- **WHEN** a shoulder weapon fires a missile
- **THEN** the projectile is marked as a ballistic arc projectile
- **AND** it MUST NOT be blocked by walls or solid terrain tiles (it flies over them)
- **AND** only the target at the impact point is affected

#### Scenario: Ballistic projectile — visual representation
- **WHEN** a ballistic projectile is in flight
- **THEN** a shadow is drawn at the ground-level position (the straight path to impact)
- **AND** the missile body is drawn offset upward on screen, simulating altitude (negative screen Y offset)
- **AND** the missile body shrinks as it ascends and grows as it descends (inverse sine scale: 1.0 → 0.25 at apex → 1.0 at impact)
- **AND** missile and shadow converge at the impact point

#### Scenario: Ballistic projectile — spawn position
- **WHEN** a shoulder weapon fires
- **THEN** the projectile spawns from the shoulder mount position, NOT the grip barrel position
- **AND** the shoulder mount is located at the rear face of the arm, slightly behind the mech center
