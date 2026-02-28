## 1. Engine & Setup Refactoring

- [x] 1.1 Create `src/game/PlayerProfile.js` singleton. Implement state properties for loadout (defaults to current Config), credits, and unlocked inventory.
- [x] 1.2 Create `src/engine/AppManager.js` to initialize the `GameLoop`, `InputHandler`, `Canvas`, and house the scene transition logic (`switchScene(scene)`).
- [x] 1.3 Update `src/main.js` to instantiate `PlayerProfile` and boot the `AppManager` instead of `Game.js`.

## 2. Map Scene Extraction

- [x] 2.1 Rename `src/game/Game.js` to `src/game/MapScene.js`.
- [x] 2.2 Refactor `MapScene.js`: remove canvas context setup, input handling instantiation, and gameloop setup. Instead, expect an `engine` context passed into its constructor or `enter(engine)` method.
- [x] 2.3 Refactor `MapScene.js`: update `Mech` instantiation to read from `PlayerProfile.loadout` instead of `CONFIG.STARTING_LOADOUT`.
- [x] 2.4 Refactor `MapScene` victory/defeat logic to transition back to the `BaseScene` (or restart the scene) through the `AppManager`, rather than freezing the game state globally.

## 3. Base Scene Implementation

- [x] 3.1 Create `src/game/BaseScene.js` implementing the required scene interface (`enter`, `update`, `draw`, `leave`).
- [x] 3.2 Add static map generation to `BaseScene.js` that spans an enclosed metal room. (e.g. bypass procedural LaneGenerator).
- [x] 3.3 Instantiate the player `Mech` in `BaseScene.js` using `PlayerProfile`. Ensure movement works, but clicking/firing weapons does not trigger.
- [x] 3.4 Create rudimentary `Interactable` entity (or just simple hardcoded regions in `BaseScene`) representing a "Hangar Console" and "Map Device" that draw prompt text when approached.

## 4. UI & Integration Fixes

- [x] 4.1 Update `UIManager` and existing DOM screens to listen to the currently active Scene's events, rather than statically binding to the global `Game` object.
- [x] 4.2 Verify round-trip logic: starting the app lands in `BaseScene`, walking to the Map Device triggers a `AppManager.switchScene(new MapScene())`, and beating/dying in the map returns the player to the `BaseScene`.
