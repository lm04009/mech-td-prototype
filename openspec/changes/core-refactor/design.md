# Design: Core Architecture Refactor

## Context
The current `main.js` is a monolithic file handling input, update loops, rendering, and game logic. To support the "Blight-style" continuous game loop and future complexity, we need to decompose this into specialized systems.

## Architecture Overview
We will move from a "Global Script" pattern to a "Component-Based" pattern (lite).

### Systems
1.  **GameLoop (`src/engine/GameLoop.js`)**: Manages the time-step.
2.  **Game (`src/game/Game.js`)**: The root container for game state.
3.  **EntityManager (`src/game/EntityManager.js`)**: Manages collections of game objects.
4.  **EncounterManager (`src/game/EncounterManager.js`)**: Manages enemy spawning logic (The "Director").

## Component Designs

### 1. GameLoop
**Responsibility**: Accurate time-keeping and loop management.
```javascript
class GameLoop {
    constructor(updateFn, drawFn) {
        this.lastTime = 0;
        this.running = false;
        // ...
    }
    start() { ... }
    stop() { ... }
    loop(timestamp) {
        // Calculate dt (clamped)
        // update(dt)
        // draw()
        // RequestAnimationFrame
    }
}
```

### 2. Game
**Responsibility**: The "World". Holds the Map, Player, Terminal, and Managers.
```javascript
class Game {
    constructor(canvas) {
        this.width = canvas.width;
        this.height = canvas.height;
        this.map = new GameMap(...);
        this.mech = new Mech(...);
        this.terminal = new Terminal(...);
        
        this.entities = new EntityManager();
        this.encounter = new EncounterManager(this); // Pass game ref for path/map access
    }
    
    update(dt) {
        this.mech.update(dt, ...);
        this.entities.update(dt, this.map); // Collisions handled here
        this.encounter.update(dt); // Spawns enemies into entities
    }
    
    draw(ctx) {
        // Camera transforms...
        this.map.draw(ctx);
        this.entities.draw(ctx);
        // ...
    }
}
```

### 3. EntityManager
**Responsibility**: Update, Draw, and Collision Detection for dynamic objects.
-   **Lists**: `enemies`, `projectiles`, `towers`.
-   **Method**: `update(dt)` -> Moves everything, checks `Projectile vs Enemy` and `Enemy vs Terminal`.
-   **Method**: `draw(ctx)` -> Renders arrays.

### 4. EncounterManager (The "Director")
**Responsibility**: Controls *when* and *where* enemies spawn.
-   **State**: `timeElapsed`, `activeLanes`, `intensity`.
-   **Logic**:
    -   Instead of a simple `setInterval`, it checks `timeElapsed`.
    -   *Example*: "If time > 30s, enable SpawnPoint B".
    -   Directly calls `game.entities.addEnemy(new Enemy(...))` when spawning.
-   **Blight Alignment**: This class is the "Script" of the level. It runs continuously. There is no pause.

### 5. EventBus (`src/engine/EventBus.js`)
**Responsibility**: Decoupled communication between systems.
-   **Methods**: `on(event, callback)`, `off(event, callback)`, `emit(event, data)`
-   **Usage**:
    -   `EncounterManager` emits `ENEMY_KILLED`.
    -   `Game` (Economy) listens to add credits.
    -   `UI` (future) listens to update score.
    -   Avoids `EncounterManager` needing to know about `Economy` or `UI`.

## Directory Structure
```
src/
  main.js         # Entry point (creates Game, starts Loop)
  engine/
    GameLoop.js   # Generic RAF loop
    EventBus.js   # Pub/Sub system
  game/
    Game.js       # Main state container
    EntityManager.js
    EncounterManager.js
    ... (existing classes: Mech, Map, Terminal)
```

## Decisions
-   **Event Bus**: We will implement a simple `EventBus` now. With the expected complexity of v0 (Achievements, UI, Sound, Stats), direct coupling will become unmanageable very quickly.
-   **Input**: `InputHandler` will be owned by `Game` and passed to `Mech.update`.

## Risks
-   **Refactor Bugs**: Breaking collision or camera logic during the move.
-   **Mitigation**: Perform visual regression testing on movement, shooting, and building after each system extraction.
