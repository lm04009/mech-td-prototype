# Spec: Projectile Physics

## ADDED Requirements

### Requirement: Linear Movement

Projectiles MUST travel in a straight line from their origin point.

#### Scenario: Frame Update
- **WHEN** a projectile updates
- **THEN** it MUST move along its velocity vector: Position += Velocity * dt

### Requirement: Lifetime Limits

Projectiles MUST not exist forever.

#### Scenario: Range/Time Expiration
- **WHEN** a projectile exceeds its maximum range OR lifetime
- **THEN** it MUST be removed from the game world
