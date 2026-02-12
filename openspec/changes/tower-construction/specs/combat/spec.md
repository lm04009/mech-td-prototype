# Spec: Tower Combat

## ADDED Requirements

### Requirement: Targeting

Towers must automatically acquire targets within range.

#### Scenario: Target Acquisition
- **GIVEN** multiple enemies are within range
- **THEN** the tower **MUST** select the enemy closest to the Terminal (furthest along path)

### Requirement: Projectile Physics

Tower projectiles must obey the same physical rules as the player's.

#### Scenario: Wall Collision
- **GIVEN** a tower fires a projectile at an enemy
- **AND** a `WALL` tile is in the flight path
- **THEN** the projectile **MUST** impact the wall and be destroyed
- **AND** the enemy **MUST NOT** take damage (Line of Sight check)

#### Scenario: Water Flyover
- **GIVEN** a tower fires a projectile
- **AND** a `WATER` tile is in the flight path
- **THEN** the projectile **MUST** fly over the water unimpeded (unless it's a torpedo, but standard bullets fly)
