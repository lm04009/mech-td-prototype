# Design: DOM-Based UI Framework

## Architecture

The UI will be a distinct layer overlaying the game canvas. It communicates with the game logic primarily through a one-way data flow (Events -> UI) and calls game methods for actions (UI -> Game).

### Module Structure
```ascii
src/
  ui/
    UIManager.js       # Orchestrator
    BaseScreen.js      # Base class for screens
    components/
        HUD.js         # Heads-Up Display (Heath, Ammo, Minimap?)
    screens/
        MainMenu.js    # Start screen
        GameOver.js    # Win/Loss screen
    ui.css             # Core UI styles
```

## detailed Design

### 1. `UIManager.js`
Singleton-like manager owned by `Game`.
-   **Properties**:
    -   `container`: Reference to `#ui-layer`.
    -   `screens`: Map of registered screens.
    -   `currentScreen`: Currently active screen.
    -   `hud`: Persistent HUD component.
-   **Methods**:
    -   `register(name, screenInstance)`
    -   `show(name, props)`: Unmounts current, mounts new.
    -   `hide()`: Clears UI (except HUD).
    -   `toggleHUD(visible)`

### 2. `BaseScreen.js`
Abstract base class.
-   **Methods**:
    -   `mount(container)`: Creates DOM elements, attaches listeners.
    -   `unmount()`: Removes DOM elements, detaches listeners.
    -   `update(dt)`: Optional per-frame update (use sparingly, prefer events).
    -   `on(event, callback)`: Helper to register event listeners that auto-cleanup on unmount.

### 3. Event Protocol
The `EventBus` is the backbone.

| Event | Payload | Trigger | UI Response |
| :--- | :--- | :--- | :--- |
| `mech:damage` | `{ hp, maxHp }` | Mech takes damage | Update HP bar width/color |
| `mech:heal` | `{ hp, maxHp }` | Mech repairs | Update HP bar |
| `terminal:damage` | `{ hp, maxHp }` | Terminal hit | Update Terminal HP bar |
| `credits:change` | `{ amount, total }` | Enemy killed / Tower built | Animate credit counter |
| `wave:start` | `{ waveNum }` | Round begins | Show "Wave X" notification |
| `game:over` | `{ reason }` | Loss condition met | Show GameOver screen |
| `game:win` | `{ }` | Win condition met | Show Victory screen |

### 4. CSS Architecture
Use **CSS Grid** for layouts and **Absolute Positioning** for the overlay.

```css
#ui-layer {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none; /* Default: click-through */
    display: grid;
    grid-template-areas: 
        "top-left top-center top-right"
        "center-left center center-right"
        "bottom-left bottom-center bottom-right";
}

.screen {
    pointer-events: auto; /* Enable clicks for menus */
    grid-area: center; /* Default centering */
    /* ... */
}

.hud-panel {
    pointer-events: none;
    /* ... */
}
```

## Implementation Plan
1.  **Refactor**: Create `src/ui/` and `UIManager.js`.
2.  **Style**: Create `src/ui/ui.css` and link it in `index.html`.
3.  **Refactor**: Move `drawUI` logic from `Game.js` to `src/ui/components/HUD.js`.
4.  **Refactor**: Move `drawGameOver`/`drawWinScreen` to specific Screen classes.
5.  **Integration**: Wire up `EventBus` events in `Mech.js`, `Terminal.js`, and `Game.js`.
