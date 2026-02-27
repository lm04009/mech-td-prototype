# Tasks: combat-foundation

## Phase 1 — Architecture: Unified CombatSystem + Data Loading

### Task 1.1: Create `CombatSystem.js`
**File**: `src/engine/CombatSystem.js`
**Status**: [x]

### Task 1.2: Load JSON data at startup
**File**: `src/main.js` (or a new `src/data/DataStore.js`)
**Status**: [x]

## Phase 2 — Mech Restructure

### Task 2.1: Rebuild `Mech.js` with 4-slot structure
**File**: `src/game/mech.js`
**Status**: [x]

---

### Task 2.2: Weapon slot firing logic
**File**: `src/game/mech.js`
**Status**: [x]

---

### Task 2.3: Input wiring for 4 slots
**File**: `src/game/Game.js` or input handler
**Status**: [x]

---

### Task 2.4: Render all 4 weapon range rings
**File**: `src/game/mech.js` — `draw()` method
**Status**: [x]

---

## Phase 3 — Enemy & Tower Data Integration

### Task 3.1: Data-drive `Enemy.js`
**File**: `src/game/enemy.js`
**Status**: [x]

---

### Task 3.2: Update `EncounterManager.js` — data-driven spawn
**File**: `src/game/EncounterManager.js`
**Status**: [x]

---

### Task 3.3: Update `Tower.js` — delegate hit resolution
**File**: `src/game/tower.js`
**Status**: [x]

---

## Phase 4 — Projectile Hit Resolution

### Task 4.1: Update `Projectile.js` — carry attacker stats
**File**: `src/game/projectile.js`
**Status**: [x]

---

### Task 4.2: Update `Game.js` — resolve hits via `CombatSystem`
**File**: `src/game/Game.js`
**Status**: [x]

---

## Phase 5 — Verification

### Task 5.1: Smoke test — all combat paths
**Status**: [ ]

Manually verify in-browser:
- [ ] Player fires RMB → Rifle projectile spawns, range ring visible
- [ ] Player fires 1/2/3 → correct slots fire (or nothing if slot empty)
- [ ] Left arm destroyed → armLeft.grip and armLeft.shoulder range rings disappear, both slots silent
- [ ] Enemy hit by player: damage uses formula, not flat 25
- [ ] Mech hit by enemy: part targeting still works
- [ ] Tower projectile hits enemy: damage resolves via CombatSystem
- [ ] Enemy spawns with correct HP from enemies.json (not hardcoded 50)
- [ ] Moving mech: speed reflects weight/power formula, not hardcoded 200

### Task 5.2: Fix `v0_prototype.md` mount rule error
**File**: `openspec/specs/v0_prototype.md`
**Status**: [x]

Create a new module with the following exported pure functions. No state. No class instantiation.

- `calcChanceToHit(attackerAccuracyRatio, defenderEvasion)` → float [0,1]
  - `max(attackerAccuracyRatio / (10000 + defenderEvasion), 0.05)`
- `calcEvasion(totalWeight, totalPowerOutput)` → int [0, 10000]
  - `max(0, min(10000, 10000 - floor(max(0, (totalWeight * 10000 / totalPowerOutput) - 3000) * 10 / 7)))`
- `calcDamage(attackStat, defenseStat)` → int >= 1
  - `max(1, round(attackStat * attackStat / (attackStat + defenseStat)))`
- `selectTargetPart(parts)` → part object
  - Weighted roll: Body=1, armLeft=2, armRight=2, legs=3 (total 8)
  - If rolled part has HP <= 0: reroll uniformly from parts with HP > 0
- `resolveHit(accuracyRatio, attackStat, target)` → `{ hit: bool, partKey: string|null, damage: int }`
  - Rolls `ChanceToHit` against `target.evasion` (or 0 for enemies)
  - If hit: calls `selectTargetPart` and `calcDamage`
  - Returns structured result; caller is responsible for applying damage
- `calcAttackInterval(typeAttackInterval, localAttackSpeedMod, globalAttackSpeedMods)` → int (ms)
  - `floor(typeAttackInterval * 10000 / (10000 + localAttackSpeedMod))`
  - Then: `floor(result * 10000 / (10000 + sum(globalAttackSpeedMods)))`
- `calcMoveEfficiency(totalWeight, totalPowerOutput)` → int [5000, 10000]
  - `max(5000, 10000 - floor(max(0, (totalWeight * 10000 / totalPowerOutput) - 7000) * 5 / 3))`
- `calcActualSpeed(entityBaseSpeed, additiveMods, moveEfficiency, statusMultipliers)` → int
  - Per formula in `Formulas.md`

---

### Task 1.2: Load JSON data at startup
**File**: `src/main.js` (or a new `src/data/DataStore.js`)
**Status**: [ ]

Before the game loop starts, fetch and parse all three data files:
- `src/data/weapons.json`
- `src/data/parts.json`
- `src/data/enemies.json`

Make the loaded data available to `Game`, `Mech`, and `EncounterManager`. A simple module-level export (`DataStore`) is sufficient — no class needed.

Define the starting Mech preset as a constant in `src/game/Config.js`:
```js
STARTING_LOADOUT: {
    body:     { partType: 'Body', id: 11001 },   // Body A
    armLeft:  { partType: 'Arm',  id: 12001 },   // Arm A
    armRight: { partType: 'Arm',  id: 12001 },   // Arm A
    legs:     { partType: 'Legs', id: 13001 },   // Legs A
    slots: {
        armLeft:  { grip: 21006, shoulder: null },  // Rifle A
        armRight: { grip: null,  shoulder: 22001 }, // Light Shield
    }
}
```
(Adjust slot assignments as appropriate for early game feel.)

---

## Phase 2 — Mech Restructure

### Task 2.1: Rebuild `Mech.js` with 4-slot structure
**File**: `src/game/mech.js`
**Status**: [ ]

Replace the `weaponLeft` field entirely. New structure:

```js
this.slots = {
    armLeft:  { grip: null, shoulder: null },
    armRight: { grip: null, shoulder: null }
};
// Each non-null slot: { weaponData: {...}, cooldownMs: 0 }
```

- Load part and weapon data from `DataStore` using `STARTING_LOADOUT`
- Compute `TotalWeight`, `TotalPowerOutput`, `MoveEfficiency`, `ActualSpeed`, `Evasion` at construction
- Expose `this.evasion` so projectile hit resolution can read it
- Replace `this.speed = 200` with `this.actualSpeed` from `CombatSystem.calcActualSpeed()`

---

### Task 2.2: Weapon slot firing logic
**File**: `src/game/mech.js`
**Status**: [ ]

Replace the single `weaponLeft.fire()` call.

For each slot on fire input:
1. Check arm HP > 0 (slot usable)
2. Check `slot.cooldownMs <= 0`
3. Calculate barrel position from the arm's mount offset
4. Spawn `N = weaponData.ProjectilesPerRound` projectiles:
   - `DeliveryType = "Linear"`: all projectiles at same angle toward mouse cursor
   - `DeliveryType = "Fan"`: spread evenly across `FAN_SPREAD_DEGREES` (define in `Config.js`, e.g. 20°)
   - `DeliveryType = "Swing"`: do NOT implement — log a warning and exit silently
5. Each projectile carries: `attackStat`, `accuracyRatio` (combined weapon + arm), `faction`, `range`
6. Set `slot.cooldownMs = CombatSystem.calcAttackInterval(weaponData.TypeAttackInterval, weaponData.LocalAttackSpeedMod, [])` on the first projectile spawn
7. Update `slot.cooldownMs -= dt` in the mech's `update()` loop

---

### Task 2.3: Input wiring for 4 slots
**File**: `src/game/Game.js` or input handler
**Status**: [ ]

Map player inputs to slot fire calls:
- Right Mouse Button (`inputState.isRightDown`) → `mech.fireSlot('armLeft', 'grip', mousePos)`
- Key `1` (`inputState.key1`) → `mech.fireSlot('armRight', 'grip', mousePos)`
- Key `2` (`inputState.key2`) → `mech.fireSlot('armLeft', 'shoulder', mousePos)`
- Key `3` (`inputState.key3`) → `mech.fireSlot('armRight', 'shoulder', mousePos)`

Ensure existing left-click input is removed or repurposed. Each `fireSlot` call returns an array of projectiles (possibly empty).

---

### Task 2.4: Render all 4 weapon range rings
**File**: `src/game/mech.js` — `draw()` method
**Status**: [ ]

For each slot with a weapon equipped and its arm HP > 0:
- Draw a circle at the arm's world position with radius = `weaponData.RangeMax * TILE_SIZE`
- Use a distinct color per slot:
  - Left Grip: `rgba(255, 255, 0, 0.15)` (yellow)
  - Right Grip: `rgba(0, 255, 255, 0.15)` (cyan)
  - Left Shoulder: `rgba(255, 128, 0, 0.15)` (orange)
  - Right Shoulder: `rgba(128, 0, 255, 0.15)` (purple)
- Remove the old single range-ring draw call

---

## Phase 3 — Enemy & Tower Data Integration

### Task 3.1: Data-drive `Enemy.js`
**File**: `src/game/enemy.js`
**Status**: [ ]

- Remove the `if (type === 'BASIC') { ... } else { ... }` branches
- Constructor signature becomes `new Enemy(path, enemyData)` where `enemyData` is a plain object from `enemies.json`
- Map fields: `HP → this.hp/maxHp`, `Attack → this.attackStat`, `Defense → this.defense`, `AccuracyRatio → this.accuracyRatio`, `RangeMax → this.attackRange` (converted to pixels), `TypeAttackInterval → this.attackIntervalMs`
- Replace hardcoded `attackCooldown = 1.0` with `CombatSystem.calcAttackInterval(enemyData.TypeAttackInterval (assume 1000 if missing), 0, [])`
- Evasion for enemies is 0 (flat, no formula) — simplification for now

---

### Task 3.2: Update `EncounterManager.js` — data-driven spawn
**File**: `src/game/EncounterManager.js`
**Status**: [ ]

- Accept `DataStore` (or `enemiesData` array) at construction
- In `spawnEnemy(portal)`: look up `portal.enemyType` against `enemiesData` array by `Name` field
- Pass the matched data object to `new Enemy(path, enemyData)`
- If no match found: log error and skip spawn (don't crash)

---

### Task 3.3: Update `Tower.js` — delegate hit resolution
**File**: `src/game/tower.js`
**Status**: [ ]

- Tower stats stay hardcoded for now (no JSON file)
- Add `this.attackStat = 25` and `this.accuracyRatio = 9000` (high accuracy for towers)
- Tower projectile carries these values (same as player projectile)
- No other changes to Tower (targeting, range, cooldown unchanged for now)

---

## Phase 4 — Projectile Hit Resolution

### Task 4.1: Update `Projectile.js` — carry attacker stats
**File**: `src/game/projectile.js`
**Status**: [ ]

- Add fields to constructor: `this.attackStat`, `this.accuracyRatio`
- Remove implied `this.damage` (damage is now resolved at collision, not baked into the projectile)
- Keep `this.faction` for collision target filtering

---

### Task 4.2: Update `Game.js` — resolve hits via `CombatSystem`
**File**: `src/game/Game.js`
**Status**: [ ]

Find the projectile–entity collision detection loop and replace flat `takeDamage(p.damage)` calls with:

```js
const result = CombatSystem.resolveHit(p.accuracyRatio, p.attackStat, target);
if (result.hit) {
    if (target.parts) {
        // Structured target (Mech): apply to specific part
        target.parts[result.partKey].hp -= result.damage;
        target.parts[result.partKey].hp = Math.max(0, target.parts[result.partKey].hp);
        target.onPartDamaged(result.partKey, result.damage); // notifies event bus, death check
    } else {
        // Simple target (Enemy, Terminal): flat HP
        target.hp -= result.damage;
        target.hp = Math.max(0, target.hp);
        if (target.hp <= 0) target.markedForDeletion = true;
    }
}
p.markedForDeletion = true;
```

Remove `processHit()` from `Mech.js` after migrating its logic into `CombatSystem`.

---

## Phase 5 — Verification

### Task 5.1: Smoke test — all combat paths
**Status**: [ ]

Manually verify in-browser:
- [ ] Player fires RMB → Rifle projectile spawns, range ring visible
- [ ] Player fires 1/2/3 → correct slots fire (or nothing if slot empty)
- [ ] Left arm destroyed → armLeft.grip and armLeft.shoulder range rings disappear, both slots silent
- [ ] Enemy hit by player: damage uses formula, not flat 25
- [ ] Mech hit by enemy: part targeting still works
- [ ] Tower projectile hits enemy: damage resolves via CombatSystem
- [ ] Enemy spawns with correct HP from enemies.json (not hardcoded 50)
- [ ] Moving mech: speed reflects weight/power formula, not hardcoded 200

### Task 5.2: Fix `v0_prototype.md` mount rule error
**File**: `openspec/specs/v0_prototype.md`
**Status**: [ ]

Line 83–84 incorrectly states "One weapon per arm / No multi-weapon mounts in v0." Update to reflect the correct 4-slot (Grip + Shoulder per arm) structure, matching `mech-core/spec.md` and `weapons.json` design.
