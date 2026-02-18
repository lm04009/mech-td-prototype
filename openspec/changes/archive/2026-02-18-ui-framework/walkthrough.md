# UI Framework Walkthrough

## Summary
We have successfully migrated the game UI from a Canvas-based drawing approach to a **DOM-based, event-driven architecture**. This enables:
-   **CSS Styling**: Flexible, responsive layouts using Grid/Flexbox.
-   **Interactivity**: Native support for buttons, inputs, and mouse events.
-   **Performance**: UI updates only occur when game state changes (events), rather than every frame.

## Changes

### 1. New UI Module (`src/ui/`)
-   **`UIManager.js`**: The central controller that manages the active screen (`currentScreen`) and the persistent HUD.
-   **`BaseScreen.js`**: Abstract base class for all UI screens (`mount`, `unmount`, `update`).
-   **`ui.css`**: Core styles defining the `#ui-layer`, HUD grid layout, and common component styles (`.btn`, `.hud-panel`).

### 2. Components
-   **`HUD.js`**:
    -   **Health Bar**: Subscribes to `mech:damage`.
    -   **Credits**: Subscribes to `credits:change`.
    -   **Terminal**: Subscribes to `terminal:damage`.
    -   **Hostile Count**: Updates via lightweight polling in `update()`.
-   **`GameOverScreen.js`**: Overlay shown when the player is destroyed or terminal falls.
-   **`GameWinScreen.js`**: Overlay shown when the mission is complete.

### 3. Game Integration
-   **`Game.js`**:
    -   **Removed**: `drawUI()`, `drawGameOver()`, `drawWinScreen()`.
    -   **Added**: `UIManager` instantiation and integration into the game loop.
    -   **Event Wiring**: Emits `game:over` and `game:win`.
-   **`Mech.js`** & **`Terminal.js`**: Emit damage events via `EventBus`.

## Verification

### Manual Verification Steps
1.  **Launch the Game**: Open `index.html` in a web browser.
2.  **Check HUD**: Ensure Health, Credits, and Terminal status are visible on top of the canvas.
3.  **Take Damage**:
    -   Let an enemy hit you or use debug commands (if any).
    -   **Verify**: The green health bar shrinks and turns red below 30%.
4.  **Earn Credits**:
    -   Destroy an enemy or build a tower.
    -   **Verify**: Credit counter updates instantly.
5.  **Game Over**:
    -   Let the Terminal reach 0 HP.
    -   **Verify**: "MISSION FAILED" overlay appears.
    -   Click "REBOOT SYSTEM".
    -   **Verify**: Game restarts and HUD resets.
