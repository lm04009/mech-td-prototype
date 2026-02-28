# click-to-move Spec

## Purpose
Defines the player mech's pathfinding-based movement system. The mech moves to player-clicked destinations using A* pathfinding, matching the PoE Blight-style control model.

## Requirements

### Requirement: LMB Click-to-Move

The player MUST be able to command the mech to move by clicking the left mouse button on walkable ground.

#### Scenario: Click on open ground
- **WHEN** the player clicks LMB on a non-socket ground tile
- **THEN** the mech MUST compute an A* path to the clicked world position and begin following it

#### Scenario: Hold LMB to update destination
- **WHEN** the player holds LMB and moves the mouse
- **THEN** the mech MUST re-path to the new cursor position approximately every 100ms
- **AND** the mech MUST update its path immediately when LMB is first pressed

#### Scenario: LMB release
- **WHEN** the player releases LMB
- **THEN** the mech MUST continue following its current path to the last destination
- **AND** stop upon reaching the final waypoint

#### Scenario: LMB on socket (no movement conflict)
- **WHEN** the player clicks LMB while hovering a buildable socket
- **THEN** the tower build action MUST execute
- **AND** no movement destination MUST be set

---

### Requirement: Pathfinding

The mech's path MUST be computed using A* on the tile grid, respecting terrain and placed towers.

#### Scenario: Diagonal movement
- **WHEN** a path is computed
- **THEN** diagonals MUST be traversable (8-directional A*)
- **AND** diagonal movement cost MUST be √2 relative to cardinal movement

#### Scenario: Mech-state-aware walkability
- **WHEN** a path is computed
- **THEN** walkability MUST be determined per the mech's current legs type
- **AND** by default water tiles MUST be unwalkable
- **AND** legs with `canCrossWater: true` MUST treat water as walkable

#### Scenario: Unreachable destination
- **WHEN** the player clicks a tile that A* cannot reach
- **THEN** the mech MUST silently path to the nearest reachable tile
- **AND** no error state, freeze, or UI indicator MUST occur

---

### Requirement: Click Ring Visual

A brief visual indicator MUST appear at the clicked world position to confirm input.

#### Scenario: Click feedback
- **WHEN** the player clicks LMB to set a new move destination
- **THEN** a ring MUST appear at the click position in world space
- **AND** the ring MUST expand and fade over approximately 300ms
- **AND** the ring MUST NOT persist after the animation completes

---

### Requirement: Speed and Penalties

Mech movement speed during pathfinding MUST respect all existing speed modifiers.

#### Scenario: Legs destroyed penalty
- **WHEN** the mech's legs HP reaches zero
- **THEN** movement speed MUST be reduced to 50% of base
- **AND** pathfinding MUST continue to function (only speed is penalized)
