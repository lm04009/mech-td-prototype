# Spec: Enemy Path & Attributes

## ADDED Requirements

### Requirement: Path Following

Enemies MUST follow a predefined sequence of waypoints.

#### Scenario: Movement
- **WHEN** an enemy is active
- **THEN** it MUST move towards its current target waypoint
- **AND** upon reaching it, select the next waypoint in the path

### Requirement: Path Visibility

The enemy path MUST be visible to the player.

#### Scenario: Map Rendering
- **WHEN** the game world is rendered
- **THEN** the path waypoints MUST be visually connected (e.g. by a line)

### Requirement: Terminal Interaction

Enemies MUST damage the Terminal upon reaching the end of their path.

#### Scenario: Reaching End
- **WHEN** an enemy reaches the final waypoint (The Terminal)
- **THEN** it MUST deal damage to the Terminal
- **AND** it MUST be removed from the game (Self-destruct/Leak)

### Requirement: Combat Vulnerability

Enemies MUST take damage from player projectiles.

#### Scenario: Projectile Hit
- **WHEN** a projectile collides with an enemy
- **THEN** the enemy MUST take damage
- **AND** the projectile MUST be destroyed
- **IF** enemy HP <= 0, the enemy MUST be destroyed
