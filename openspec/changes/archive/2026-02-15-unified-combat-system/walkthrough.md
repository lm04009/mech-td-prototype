# Walkthrough - Combat & Physics Update

## Changes Implemented
1.  **Project Rules**: Enforced strict **Screenshot Protocol** in `openspec/config.yaml`.
2.  **Enemy Physics (Blight-Style)**:
    -   Implemented **Queueing** logic (Hard Collision).
    -   Removed "Separation/Flocking" forces.
    -   Enemies now stop when blocked by Mech, Terminal, or *other Enemies* (forming a line).
    -   **Stats**: HP increased to 50, Range to 50.
3.  **Unified Combat**:
    -   Refactored `EntityManager` to use `getTargets()` for projectile collision.
    -   Ensures Towers/Mech hit Enemies, and Enemies hit Mech/Terminal consistently.

## Verification Checkpoints

### 1. Physics & Queueing
-   [x] **Block Test**: Stand in front of a spawn. Verify enemies stop and form a line behind you. They should *not* push/slide around.
-   [x] **Terminal Test**: Let enemies reach the terminal. Verify they stop at the edge and attack, forming a queue.

### 2. Combat Balance
-   [x] **Tower vs Enemy**: Verify Basic Tower takes 2 shots to kill an Enemy (25 dmg vs 50 HP).
-   [x] **Mech vs Enemy**: Verify Mech takes damage when touching enemies.

### 3. Edge Cases
-   [x] **Head-on Spawn**: Verify multiple enemies spawning at once don't crash or permanently stick.
