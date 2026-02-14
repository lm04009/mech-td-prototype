# Proposal: Core Architecture Refactor

## Goal
Decouple the monolithic `main.js` into modular systems (`Game`, `GameLoop`, `Input`, `EntityManager`, `EncounterManager`) to support future development and a "Blight-style" continuous game loop.

## Summary of Changes
Currently, `main.js` handles initialization, the game loop, input processing, state updates, and rendering. This change will:
1.  Extract a dedicated `GameLoop` to manage time and frame updates.
2.  Create a `Game` class as the central coordinator.
3.  Establish an `EntityManager` to handle diverse entities (Mechs, Enemies, Projectiles, Towers).
4.  Introduce an `EncounterManager` to handle the continuous stream of enemies attacking the **Terminal** (the core defensive objective, analogous to the Blight Pump). This aligns with the Blight-style design of continuous pressure.
5.  Reduce `main.js` to a simple entry point.

## Requirements
### Must Haves
-   **No Gameplay Changes**: The game must play exactly as it does now (v0 prototype behavior).
-   **Modular State**: Game state (`mech`, `enemies`, `towers`) must be encapsulated in their respective managers, not global variables.
-   **Continuous Loop**: The new architecture must support the continuous "Blight-style" loop where combat and building happen simultaneously.

### Nice to Haves
-   Improved performance through better entity management.

## Impacted Capabilities
-   `specs/mech-core`: Initialization and update loop location will change.
-   `specs/enemy-pathing`: Spawn logic will move to `EncounterManager`.
-   `specs/construction`: Interaction logic will move to `Input` or `Game`.
-   `specs/combat`: Projectile management will move to `EntityManager`.

## User Review Required
> [!IMPORTANT]
> This is a structural refactor. While no gameplay changes are intended, all core systems (Movement, Combat, Construction) are being touched. Regression testing is critical.
