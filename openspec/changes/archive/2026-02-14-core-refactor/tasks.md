# Tasks: Core Refactor

## 1. Engine Infrastructure
- [x] 1.1 Create `src/engine` and `src/game` directories
- [x] 1.2 Implement `GameLoop.js` (RAF, dt clamping)
- [x] 1.3 Implement `EventBus.js` (Pub/Sub)
- [x] 1.4 Move `Input.js` to `src/engine/Input.js` and verify imports

## 2. Core Game Systems
- [x] 2.1 Implement `EntityManager.js` (Skeleton)
- [x] 2.2 Implement `EncounterManager.js` (Skeleton)
- [x] 2.3 Implement `Game.js` (Main container, initializes systems)

## 3. Logic Extraction
- [x] 3.1 Extract Mech initialization and update to `Game.js`
- [x] 3.2 Extract Terminal initialization to `Game.js`
- [x] 3.3 Move `GameMap` initialization to `Game.js`
- [x] 3.4 Move `Camera` initialization to `Game.js`

## 4. Entity Migration
- [x] 4.1 Migrate Enemy spawning logic to `EncounterManager.js`
- [x] 4.2 Migrate Projectile update/collision logic to `EntityManager.js`
- [x] 4.3 Migrate Tower updating/building logic to `Game.js` / `Input`

## 5. Main.js Cleanup
- [x] 5.1 Refactor `main.js` to only bootstrap `Game` and start `GameLoop`
- [x] 5.2 Verify `requestAnimationFrame` loop is driven by `GameLoop`

## 6. Verification
- [x] 6.1 Verify Map and Terminal render
- [x] 6.2 Verify Mech movement and shooting
- [x] 6.3 Verify Enemy spawning and pathing
- [x] 6.4 Verify Tower construction and firing
