# Proposal: Wave System (Blight Style)

## Goal
Implement a dynamic "Wave System" based on PoE Blight mechanics, focusing on **Telegraphing** and **Portal Timing**.

## Verified Mechanics (Blight-Style)
1.  **Telegraphing (Faded Path Preview)**:
    -   The entire path from **Spawn Point to Terminal** appears in a "Faded" / "Inactive" state *before* the wave starts.
    -   This is **not** a growing animation (to ensure visibility on large maps).
    -   This static preview warns the player where enemies will come from.
2.  **Lane Activation**:
    -   When the timer hits, the Faded Path becomes **Active** (visually distinct, e.g., solid/glowing).
    -   The Portal opens at the Spawn Point.
3.  **Finite Waves**:
    -   Each Portal is responsible for spawning a specific, finite **Count** of enemies.
    -   Once the count is reached, the Portal stops spawning.
    -   **Important**: The **Active Path** (Root) remains visible and traversable. It does *not* fade. This allows future enemies/waves to use the same path segments (crossing paths).

## Requirements
### Must Haves
-   **Static Telegraphing**: Render paths in a "Faded" state before activation.
-   **Visual State Change**: Switch path visual from Faded -> Active when spawning starts.
-   **Portal Event Structure**:
    -   `path_id`: Which lane? (North, South, etc.)
    -   `start_time`: When does the portal **activate** (spawn start)?
    -   `total_enemies`: How many enemies in this packet?
    -   `spawn_rate`: How fast do they spawn?
    -   `enemy_type`: What spawns?

-   **Global Rules**:
    -   `TELEGRAPH_DURATION`: Fixed time (e.g., 5s) *before* `start_time` when the Faded Preview appears.
-   **Finite Spawns**: Logic to spawn exactly $N$ enemies from a specific portal, then stop.

## Impacted Capabilities
-   `src/game/map.js`: Needs to support dynamic paths (roots).
-   `src/game/EncounterManager.js`: Needs to handle the timeline: `Start Root` -> `Wait` -> `Open Portal` -> `Spawn N Enemies` -> `Close/End`.

## User Review Required
> [!IMPORTANT]
> **Telegraphing**: We will visualize a **Static Faded Path** (Spawn -> Terminal).
> **Finite**: Portals will exhaust their spawn pool and close.
