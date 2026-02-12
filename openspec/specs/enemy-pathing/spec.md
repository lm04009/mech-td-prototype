# enemy-pathing Specification

## Purpose
TBD - created by archiving change simple-enemy. Update Purpose after archive.
## Requirements
### Requirement: Path Following

Enemies MUST follow a predefined sequence of waypoints.

#### Scenario: Movement
- **WHEN** an enemy is active
- **THEN** it MUST move towards its current target waypoint
- **AND** upon reaching it, select the next waypoint in the path

### Requirement: Path Validity

The enemy path MUST respect the terrain rules of the map.

#### Scenario: Terrain Traversal
- **WHEN** a path segment is defined between two waypoints
- **THEN** reasonable straight-line movement between them MUST NOT cross `Non-Walkable` terrain (Walls, Water)

### Requirement: Map Centricity

Paths and Objectives MUST be defined relative to the Map Grid.

#### Scenario: Positioning
- **WHEN** the map is generated
- **THEN** the Terminal MUST be at the logical Map Center
- **AND** paths MUST originate from valid Map Edges relative to that center

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

