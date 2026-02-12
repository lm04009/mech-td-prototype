# Spec: Tower Construction

## ADDED Requirements

### Requirement: Tower Sockets

Towers can **ONLY** be built on specific "Socket" tiles pre-defined in the map.

#### Scenario: Valid Socket
- **GIVEN** the mouse is hovering over a tile defined as `TERRAIN.SOCKET`
- **AND** the socket is empty
- **THEN** the placement is **VALID**
- **AND** the Ghost snaps to the socket

#### Scenario: Invalid Location
- **GIVEN** the mouse is hovering over `TERRAIN.GROUND` (even if empty)
- **THEN** the placement is **INVALID**

> [!IMPORTANT]
> This overrides previous assumptions about free placement. Strategy comes from choosing *which* socket to use, not *where* to place.
