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

### Requirement: Context-Sensitive Building (No Modes)

-   There is **NO** distinct "Build Mode". Use the mouse cursor.
-   **Interaction Priority**:
    1.  **Socket Interaction**: If hovering over a valid socket, clicks interact with the socket (Build/Upgrade).
    2.  **Combat**: If NOT interacting with a socket, clicks fire the main weapon.

#### Scenario: Building a Tower
-   **GIVEN** the mouse is hovering over an `Empty Socket`
-   **AND** the player has enough credits
-   **THEN** a "Ghost" preview is shown automatically
-   **AND** clicking **Builds the Tower**
-   **AND** the Main Weapon does **NOT** fire

#### Scenario: Combat
-   **GIVEN** the mouse is **NOT** hovering over a `TERRAIN.SOCKET`
-   **THEN** clicking fires the Main Weapon
