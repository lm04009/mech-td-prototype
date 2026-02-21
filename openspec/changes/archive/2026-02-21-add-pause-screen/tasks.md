## 1. State Management

- [x] 1.1 Add `PAUSED` state to `GameState` enumeration in `src/game/GameState.js`.

## 2. Pause Screen UI

- [x] 2.1 Create `src/ui/screens/PauseScreen.js` extending `BaseScreen` to construct a semi-transparent dark overlay and "PAUSED" typography.
- [x] 2.2 Register the new screen in `Game.js` inside the constructor (`this.uiManager.registerScreen('Pause', new PauseScreen(this.uiManager));`).

## 3. Game Loop Integration & Input Handling

- [x] 3.1 Modify `Game.js` `update(dt)` method to return early if `this.gameState === GameState.PAUSED` to effectively freeze active game simulation.
- [x] 3.2 Update `Game.js` `onKeyDown(e)` logic to handle the `Escape` key trigger, toggling between `PLAYING` and `PAUSED` states, and appropriately instructing `UIManager` to show or hide the `Pause` screen.
