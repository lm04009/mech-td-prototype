# Tasks: combat-foundation

## Phase 1 — Architecture: Unified CombatSystem + Data Loading

### Task 1.1: Create `CombatSystem.js`
**File**: `src/engine/CombatSystem.js`
**Status**: [x]

### Task 1.2: Load JSON data at startup
**File**: `src/main.js`, `src/data/DataStore.js`
**Status**: [x]

## Phase 2 — Mech Restructure

### Task 2.1: Rebuild `Mech.js` with 4-slot structure
**File**: `src/game/mech.js`
**Status**: [x]

### Task 2.2: Weapon slot firing logic
**File**: `src/game/mech.js`
**Status**: [x]

### Task 2.3: Input wiring for 4 slots
**File**: `src/game/Game.js`, `src/engine/Input.js`
**Status**: [x]

### Task 2.4: Render all 4 weapon range rings
**File**: `src/game/mech.js` — `draw()` method
**Status**: [x]

## Phase 3 — Enemy & Tower Data Integration

### Task 3.1: Data-drive `Enemy.js`
**File**: `src/game/enemy.js`
**Status**: [x]

### Task 3.2: Update `EncounterManager.js` — data-driven spawn
**File**: `src/game/EncounterManager.js`
**Status**: [x]

### Task 3.3: Update `Tower.js` — delegate hit resolution
**File**: `src/game/tower.js`
**Status**: [x]

## Phase 4 — Projectile Hit Resolution

### Task 4.1: Update `Projectile.js` — carry attacker stats
**File**: `src/game/projectile.js`
**Status**: [x]

### Task 4.2: Update `Game.js` — resolve hits via `CombatSystem`
**File**: `src/game/Game.js`
**Status**: [x]

## Phase 5 — Verification

### Task 5.1: Smoke test — all combat paths
**Status**: [x]

Verified in-browser across multiple play sessions:
- [x] Player fires RMB → Machinegun projectile spawns as burst, range ring visible
- [x] Player fires 1/2/3 → correct slots fire (Shotgun, Missile Launcher, Shield cycle visible)
- [x] Left arm destroyed → armLeft.grip and armLeft.shoulder range rings disappear, both slots silent
- [x] Enemy hit by player: damage uses formula (confirmed via HUD HP drain)
- [x] Mech hit by enemy: part targeting works (arms, legs, body take independent damage)
- [x] Tower projectile hits enemy: damage resolves via CombatSystem
- [x] Enemy spawns with correct HP from enemies.json
- [x] Moving mech: speed reflects weight/power formula
- [x] Terminal not attacked by enemies (melee range fix): fixed via surface-distance check
- [x] Shield auto-cycle active/cooldown with whole-mech defense bonus
- [x] Burst fire (Machinegun/Missile Launcher): sequential rounds with IntraBurstInterval

### Task 5.2: Fix `v0_prototype.md` mount rule error
**File**: `openspec/specs/v0_prototype.md`
**Status**: [x]

Mount rule corrected to reflect 4-slot (Grip + Shoulder per arm) structure.
