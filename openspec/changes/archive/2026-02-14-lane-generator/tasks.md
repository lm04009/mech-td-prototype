# Task: Implement Lane Generator

- [ ] Create `LaneGenerator` Class <!-- id: 0 -->
    - [ ] Implement A* Algorithm <!-- id: 1 -->
    - [ ] Implement `findPath(start, end, map)` <!-- id: 2 -->
    - [ ] Implement `placeSockets(path, map)` <!-- id: 3 -->
- [ ] Integrate into `GameMap` <!-- id: 4 -->
    - [ ] Update `setupTestLevel` to use Generator <!-- id: 5 -->
    - [ ] Store generated Lanes in Map <!-- id: 6 -->
- [ ] Update `EncounterManager` <!-- id: 7 -->
    - [ ] Use generated Lanes for logic <!-- id: 8 -->
    - [ ] Handle socket unlocking <!-- id: 9 -->
- [ ] Verification <!-- id: 10 -->
    - [ ] Verify paths respect walls/water <!-- id: 11 -->
    - [ ] Verify sockets are placed and unlock correctly <!-- id: 12 -->
