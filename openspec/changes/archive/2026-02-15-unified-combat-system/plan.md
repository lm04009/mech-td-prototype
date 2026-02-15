# Implementation Plan - Unified Combat System & Blight Physics

## Problem
Enemies were passing through the player mech (no collision) and stacking on top of each other (bad physics). The combat system was fragmented (Towers hit Enemies, but Enemies ignored Mech).

## Implemented Changes

### 1. Core Combat Architecture
-   **Standardize `Damageable` Interface**:
    -   Implemented `hp`, `maxHp`, `takeDamage()` on `Mech`, `Enemy`, `Terminal`.
-   **Update `EntityManager`**:
    -   Added `getTargets(excludingFaction)` to unify collision logic.

### 2. Enemy Physics (Blight-Style)
-   **Queueing Logic**:
    -   Removed "Separation/Flocking" forces.
    -   Enemies now stop ("Hard Collision") if blocked by Mech, Terminal, or *other Enemies*.
    -   Result: They form a line/queue behind the blocker.
-   **Stats**:
    -   HP increased to 50 (Survives 1 tower shot).
    -   Range increased to 50 (Can reach Terminal/Mech).

### 3. Projectile Collision
-   Refactored `EntityManager` to use `getTargets()` for all projectiles.
-   Enabled Mech to shoot Enemies, and Towers to shoot Enemies using same logic.

### 4. Edge Cases (Handled)
-   **Head-on Spawn**: Tie-broken by array index/distance check.
-   **Accordion Effect**: Accepted for prototype (hard stop).
-   **Flanking**: Resume logic handled by frame updates.

## Verification
-   [x] Mech blocks Enemies (Queue forms).
-   [x] Mech takes damage from Enemies.
-   [x] Terminal takes damage from Enemies.
-   [x] Towers kill Enemies (2 shots).
