# Spec: Camera System

## ADDED Requirements

### Requirement: Fixed Map Dimensions

The game map must represent a fixed world size, independent of the player's display device.

#### Scenario: Map Initialization
- **GIVEN** the game starts
- **THEN** the Map dimensions **MUST** be fixed (e.g., 50x50 tiles)
- **AND** the Terminal **MUST** be positioned at the center of this fixed world

### Requirement: Camera Viewport

The player views the game world through a Camera that shows a subset of the Map.

#### Scenario: Rendering
- **GIVEN** a game entity at World Coordinate `(wx, wy)`
- **AND** the Camera is at `(cx, cy)`
- **THEN** the entity **MUST** be rendered at Screen Coordinate `(wx - cx, wy - cy)`

### Requirement: Camera Following

The Camera must follow the player's Mech to keep it visible.

#### Scenario: Mech Movement
- **WHEN** the Mech moves to `(mx, my)`
- **THEN** the Camera position **MUST** update to center `(mx, my)` on the screen
- **UNLESS** doing so would show area outside the Map bounds (Camera Clamping)

### Requirement: Input Transformation

Mouse inputs must be correctly mapped to the world.

#### Scenario: Aiming
- **GIVEN** the player moves the mouse to Screen Coordinate `(sx, sy)`
- **AND** the Camera is at `(cx, cy)`
- **THEN** the game logic **MUST** interpret this as World Coordinate `(sx + cx, sy + cy)`
