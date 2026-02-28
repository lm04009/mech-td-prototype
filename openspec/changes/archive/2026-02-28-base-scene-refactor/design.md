## Context

Currently, `Game.js` boots the engine, handles the canvas rendering loop, instantiates all game entities (including the hardcoded `Mech` loadout and `Map`), and manages the waves/combat logic. This architecture is tightly coupled, preventing the game from existing outside of a combat scenario. To support expanding the game loop to include a persistent player Base (with a Hangar, Map Device, etc.), the core engine concepts (rendering, input, pathfinding) must be decoupled from the combat concepts (waves, terminal, towers).

## Goals / Non-Goals

**Goals:**
- Extract the core game loop, canvas rendering, camera, and input systems into an underlying `Engine` or `AppManager`.
- Implement a `PlayerProfile` service that acts as the source of truth for the player's mech loadout, inventory, and credits.
- Refactor the current `Game.js` into `MapScene`, which receives the engine context but focuses solely on the tower defense phase.
- Create a new `BaseScene` that uses the same grid/renderer but does not load the `EncounterManager`, instead loading interactable NPC/Stations.
- Build a generic scene transition mechanism.

**Non-Goals:**
- Do not implement the actual HTML/DOM UI for the Hangar Menu or Map Selection screen in this PR (this change only setups the architectural space for them).
- Do not add new mech parts or enemy types.
- Do not change how the combat calculations (`CombatSystem`) fundamentally work.

## Decisions

1. **The `Game.js` split:** 
   - `Game.js` will be renamed to `MapScene.js`.
   - A new overarching controller, `AppManager.js` (or similar), will be created to hold the `GameLoop`, `InputHandler`, `EventBus`, and `Canvas`.
   - The `AppManager` will manage a single active `currentScene` and expose methods like `switchScene(newScene)`.

2. **Player Profile Singleton:** 
   - A `PlayerProfile` class will be instantiated in `main.js` alongside `DataStore`.
   - It will replace the hardcoded `CONFIG.STARTING_LOADOUT`.
   - Scenes will read `PlayerProfile` when initializing the player `Mech`. 
   - When transitioning from `MapScene` (Victory) back to `BaseScene`, awarded credits will be deposited directly into `PlayerProfile`.

3. **Base Scene Layout:** 
   - We will utilize the existing `GameMap` functionality. `BaseScene` will call a generic map generation function (e.g., a static room) rather than the procedural lane generator.
   - We will create an `Interactable` entity type. When the Mech is nearby, a prompt is displayed, and pressing an interaction key emits an event through the `EventBus` that the `BaseScene` (or external UI Manager) catches to open HTML overlays.

## Risks / Trade-offs

- **Risk:** Tight coupling in `Game.js` makes extraction messy. Several helpers and drawing functions assume they have direct access to `this` context representing the whole game.
  → **Mitigation:** We will rigorously pass context objects/injections (like `engine`) into the Scenes, rather than relying on massive global state. Entity systems (`EntityManager`) stay within the Scene level, not the Engine level.
- **Risk:** The `Mech` is deeply tied to `Game.js` during instantiation.
  → **Mitigation:** The `Mech` constructor will need to be updated to rely on the `PlayerProfile` data payload rather than directly importing `Config.js` for its start state.
