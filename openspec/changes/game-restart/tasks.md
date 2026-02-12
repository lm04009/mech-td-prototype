# Tasks: Game Restart

- [x] 1. Core State Infrastructure <!-- id: 0 -->
    - [x] 1.1 Define `GameState` Enum in `src/main.js` <!-- id: 1 -->
    - [x] 1.2 Create `resetGame()` function to initialize/reset variables <!-- id: 2 -->
    - [x] 1.3 Create `updatePlaying()` function (extrapolated from current loop) <!-- id: 3 -->
- [x] 2. Loop Refactor <!-- id: 4 -->
    - [x] 2.1 Refactor `gameLoop` to use State Switch <!-- id: 5 -->
    - [x] 2.2 Hook up `drawGameOver` to `GAME_OVER` state <!-- id: 6 -->
- [ ] 3. Input Handling <!-- id: 7 -->
    - [x] 3.1 Verify Win/Loss logic transitions to `GAME_OVER` <!-- id: 8 -->
    - [x] 3.2 Add 'R' key listener to trigger `resetGame()` <!-- id: 9 -->
- [ ] 4. Verify <!-- id: 10 -->
    - [ ] 4.1 Verify Game Over triggers correctly <!-- id: 11 -->
    - [ ] 4.2 Verify Restart resets all entities (Enemies, Projectiles, Terminal HP) <!-- id: 12 -->
