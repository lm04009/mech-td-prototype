# Mech TD Browser Prototype – v0 Specification

## 0. Purpose
This document defines a **locked v0 prototype specification** for a browser‑based game.

The goal of the prototype is **design validation**, not polish or completeness.
Specifically, it must answer:

- Does *Blight‑style TD + an actively piloted unit* work when the unit is a **Front Mission–style mech** with parts and weapon ranges?
- Do **terrain constraints and map layout** meaningfully affect tactics?

---

## 1. Hard Constraints

- Runs directly in a browser as a **static site**.
- Deployment model: **push to GitHub → reload browser → game runs**.
- No build step, no transpilation, no bundling, no CI.
- Plain **HTML + JavaScript (ES modules) + assets** only.
- Single developer. AI may generate code later, but **not at this stage**.

---

## 2. Core Mental Model

### 2.1 Blight‑style structure

- Enemies spawn from fixed portals.
- Enemies follow **pre‑authored lane paths** toward a single objective.
- Player is **not lane‑bound** and moves freely in navigable space.
- Towers act autonomously and are built only at fixed sockets.

### 2.2 Active player combat

- Player actively fights alongside towers.
- Player is a continuous spatial actor inside the map.
- This is **not** classic tower defense where the player is only a commander.

---

## 3. Player Unit: Mech (Front Mission Rules)

### 3.1 Parts

The mech consists of discrete parts, each with its own HP:

- Torso (core)
- Legs
- Left arm
- Right arm

### 3.2 Damage consequences

- Torso destroyed → immediate loss (player death).
- Legs destroyed → movement disabled (or near‑disabled; exact rule fixed in implementation).
- Arm destroyed → all weapons mounted on that arm become unusable.

This is a **physical part‑based damage model**, not a stat abstraction.

---

## 4. Weapons & Ranges

### 4.1 Weapon archetypes (v0)

Weapon categories are defined primarily by **range**:

- Long range
- Medium range
- Melee

### 4.2 Range importance

- Weapon ranges are **explicit**.
- Ranges are **mechanically enforced**.
- Ranges are **visually represented** (e.g. overlays).

This is a deliberate departure from PoE‑style skill abstraction.

### 4.3 Mounting rules (v0)

- Each arm has two weapon slots: **Grip** (hand weapon) and **Shoulder**.
- The four slots fire independently on their assigned inputs (RMB, 1, 2, 3).
- Destroying an arm disables both its Grip and Shoulder slots.

---

## 5. Maps & Terrain (Critical to Validation)

### 5.1 Collision & blocking

- Maps contain **hard terrain**:
  - Walls
  - Water or other uncrossable areas
- Player movement is blocked by terrain.
- Enemies remain lane‑bound regardless of terrain.

### 5.2 Tactical implications

- Choke points must exist.
- Open maps and constrained maps must play **meaningfully differently**.
- Shooting across gaps (e.g. water) is allowed in v0.

### 5.3 Required maps

Minimum for v0:

- Map A: relatively open layout.
- Map B: terrain‑heavy layout with strong choke points.

---

## 6. Towers (TD Component)

### 6.1 Placement

- Towers can only be built at predefined sockets.
- Sockets are authored per map.

### 6.2 Tower roles (v0)

Minimum required:

- Damage tower
- Slow / control tower

### 6.3 Economy

- Currency gained from enemy kills.
- Fixed build costs.
- Simple upgrade rule is optional; depth is not required.

---

## 7. Enemies

### 7.1 Movement

- Enemies follow authored lane paths (polylines).
- No navigation AI or navmesh.

### 7.2 Variety (v0 minimum)

- Light / fast enemy
- Standard enemy
- Heavy / tank enemy

Enemy variety exists only to create pressure differences.

---

## 8. Win / Lose Conditions

### 8.1 Lose conditions

- Mech torso HP reaches zero.
- The defended **Terminal** is destroyed.

### 8.2 Win condition

- Survive the wave duration with the **Terminal** still intact.

---

## 9. Explicitly Out of Scope (v0)

- Procedural maps
- Meta progression
- Inventory / loot systems
- Complex physics (forces, ragdolls, momentum)
- Navmesh or free‑roaming enemy AI
- FM‑style accuracy, ammo, or weapon sub‑systems
- Visual polish, VFX, audio polish

---

## 10. Success Criteria for the Prototype

The prototype is considered successful if:

- Player positioning + weapon range choices clearly matter.
- Terrain and choke points significantly change tactics.
- Losing a mech part creates immediate, felt consequences.
- Towers and the player complement each other rather than replacing each other.

No further scope is required for v0.

---

## 11. Notes

- This document intentionally avoids implementation details and code.
- Technical decisions come **after** this spec is accepted as correct.
- Any future additions must justify how they contribute to the validation goals above.

