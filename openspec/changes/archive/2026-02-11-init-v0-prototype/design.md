# Design: Init v0 Prototype

## Context

We are building a **locked v0 prototype** to validate specific game design hypotheses. The focus is purely on mechanics and tactical feel, not production quality.

## Goals / Non-Goals

**Goals:**
- Validate "Active Mech + TD" gameplay.
- Validate "Terrain Tactics" (choke points, blocking).
- Create a playable loop: Spawn -> Move -> Shoot -> Defend -> Win/Lose.

**Non-Goals (Explicitly Out of Scope):**
- Procedural maps.
- Meta progression.
- Inventory / loot systems.
- Complex physics (forces, ragdolls).
- Navmesh or free-roaming enemy AI (enemies are lane-bound).
- Visual/Audio polish.
- Build systems/Transpilation (must run as static HTML).

## Core Mental Model

### 1. Blight-style Structure
- **Enemies:** Spawn from fixed portals, follow pre-authored lane paths.
- **Towers:** Autonomous, built only at fixed sockets.
- **Player:** Free-moving spatial actor, not lane-bound.
- **Terminal:** The central base to defend. Destruction = Loss.

### 2. Active Player Combat
- The player is a **continuous spatial actor**, not just a cursor.
- Player actively fights alongside towers.
- Player health (mech parts) is a failure condition.

### 3. Maps & Terrain
- **Hard Terrain:** Walls/Water block player movement.
- **Shooting over gaps:** Allowed (e.g., over water) creates tactical depth.
- **Choke Points:** Must exist and be tactically relevant.

## Technical Decisions

### Tech Stack
- **Languages:** HTML5, CSS, Vanilla JavaScript (ES Modules).
- **Rendering:** Canvas API (2D).
- **Build:** None. Servable via any static HTTP server (e.g., `python -m http.server` or `npx serve`).

### Data Structures (Brief)
- **Mech:** Object with `parts: { torso, legs, lArm, rArm }`.
- **Map:** Grid or vector-based layout defining navigable vs. non-navigable areas and enemy paths.
