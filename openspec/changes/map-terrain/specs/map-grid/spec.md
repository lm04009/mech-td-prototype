# Spec: Map Grid & Terrain

## ADDED Requirements

### Requirement: Grid System

The game world MUST be represented by a tile-based grid.

#### Scenario: Map Definition
- **WHEN** the map is initialized
- **THEN** it MUST be defined as a 2D grid of tiles
- **AND** each tile MUST have a specific terrain type

### Requirement: Terrain Movement Constraints

Terrain types MUST define whether they block actor movement.

#### Scenario: Ground Movement
- **WHEN** an actor attempts to move onto Ground
- **THEN** the movement MUST be allowed

#### Scenario: Wall/Water Movement
- **WHEN** an actor attempts to move onto Wall OR Water
- **THEN** the movement MUST be blocked

### Requirement: Terrain Projectile Constraints

Terrain types MUST define whether they block projectiles.

#### Scenario: Wall Collision
- **WHEN** a projectile hits a Wall
- **THEN** it MUST be destroyed

#### Scenario: Water Traversal
- **WHEN** a projectile travels over Water
- **THEN** it MUST NOT be destroyed (Fly over)
