# Design: combat-foundation

## Context

The codebase has three entities that participate in combat (Mech, Enemy, Tower), each with bespoke attack logic. The shared design intent — one unified set of combat rules, applied to all entities via data — has never been implemented.

Current state:
- `Mech.js`: one hardcoded `Weapon` instance, no slot structure, no formula-based interval
- `Enemy.js`: hardcoded stats in `if/else` branches, flat `takeDamage()` receiver, no accuracy roll
- `Tower.js`: hardcoded damage, its own cooldown timer, bypasses all formulas
- `Weapon.js`: hardcoded `cooldownTime = 0.5`, no connection to `TypeAttackInterval`
- `Projectile.js`: carries flat damage, no accuracy resolution on hit
- `weapons.json`, `parts.json`, `enemies.json`: fully designed, never consumed at runtime

The data files use a fixed-point int system (values in 1/10000ths of a unit: `10000 = 1.0`).

## Goals / Non-Goals

**Goals:**
- Single `CombatSystem` module containing all formulas; no entity implements its own
- All entities (Mech, Enemy, Tower) initialized from JSON data
- Mech has 4 weapon slots; each fires on its assigned input; each displays range
- Accuracy/evasion roll resolved at projectile collision
- Attack interval, movement speed, and evasion all derived from data + formulas
- Multi-projectile and Fan delivery type supported

**Non-Goals:**
- Mech loadout selection UI (fixed preset for now)
- Melee/Swing delivery type (deferred)
- Tower data file (tower stays simple, but delegates to CombatSystem)
- Status effects / debuff modifiers

## Decisions

### Decision 1: `CombatSystem` as a stateless utility module

**Choice**: Pure functions, no class instantiation. `CombatSystem.resolveAttack(attackerStats, targetEntity)`, `CombatSystem.calcAttackInterval(weaponData, globalMods)`, etc.

**Why over a class with state**: Entities already own their own state. A stateless module avoids coupling and allows any entity to call it at any point without ownership concerns.

**Rationale**: Mirrors the design intent in `BasicConcepts.md` — "the player's default attack is an attack skill that is always available." The system is rule-based, not behavioural.

### Decision 2: Accuracy roll at collision, not at fire

**Choice**: `Projectile` carries the attacker's `accuracyRatio`. When a collision is detected in `Game.js`, it calls `CombatSystem.resolveHit(projectile, target)`, which rolls the miss chance before applying damage.

**Why**: A fired projectile is already in the world. Rolling miss at fire time is simpler but would require invisible "phantom" projectiles for misses, losing visual feedback. Rolling at collision gives us the option of visible miss effects later.

**Alternative rejected**: Rolling at fire and simply not spawning the projectile — breaks the visual expectation of seeing bullet travel.

### Decision 3: Mech weapon slots as a structured object

**Choice**:
```js
this.slots = {
    armLeft:  { grip: null, shoulder: null },
    armRight: { grip: null, shoulder: null }
};
```
Each slot holds `{ weaponData, cooldownMs, currentCooldown }`.

**Input bindings** (fixed for now, player-reassignable in future):
- RMB → `armLeft.grip`
- `1`  → `armRight.grip`
- `2`  → `armLeft.shoulder`
- `3`  → `armRight.shoulder`

**Why 4 discrete slots over an array**: Named slots match the spec language ("Left Arm Grip", "Right Arm Shoulder"), make arm-destruction logic trivial (`armLeft destroyed → armLeft.grip and armLeft.shoulder both disabled`), and prevent off-by-one bugs.

### Decision 4: Weapon data loaded once at startup, referenced by slots

**Choice**: A `DataLoader` (or inline async load in `main.js`) fetches `weapons.json`, `parts.json`, `enemies.json` once. Entities receive plain data objects at construction, not class instances.

**Why**: Avoids circular imports. `CombatSystem` can accept plain stat objects. Slots store the raw JSON weapon data record alongside their cooldown state.

### Decision 5: Multi-projectile via spawn loop at fire time

**Choice**: When a weapon fires (`ProjectilesPerRound > 1`), the fire function spawns N projectiles in a loop. For `Fan` delivery, each projectile is offset by a spread angle derived from the weapon's defined spread. The `FinalAttackInterval` timer starts on the first projectile spawn — not on animation complete.

**Why**: `BasicConcepts.md` is explicit: "The FinalAttackInterval timer must start the moment the first projectile is spawned." The timer is the sole authority.

### Decision 6: Enemy data-driven via EncounterManager

**Choice**: `EncounterManager.spawnEnemy(portal)` looks up `portal.enemyType` against the loaded `enemies.json` array (matched by `Name` or `ID`), and passes the data object to `new Enemy(path, data)`. `Enemy.js` constructor reads stats from the data object.

**Why**: Removes the `if (type === 'BASIC')` branch, makes adding new enemy types a JSON edit.

## Architecture Sketch

```
main.js
  └─ loads weapons.json, parts.json, enemies.json → DataStore

Game.js
  ├─ collision detection: projectile hits entity
  │    └─ CombatSystem.resolveHit(proj, target)
  │         ├─ roll ChanceToHit
  │         ├─ if hit: pick target part (weighted + reroll)
  │         └─ apply FinalDamage to part
  └─ passes DataStore to Mech, EncounterManager

Mech.js
  ├─ slots: { armLeft: { grip, shoulder }, armRight: { grip, shoulder } }
  ├─ each slot: { weaponData, currentCooldownMs }
  ├─ interval: CombatSystem.calcAttackInterval(weaponData, globalMods)
  ├─ speed: CombatSystem.calcMoveSpeed(baseSpeed, weight, power, mods)
  └─ on fire input: spawn projectiles, set slot cooldown

Enemy.js
  ├─ stats from enemies.json data object
  ├─ attack timer: CombatSystem.calcAttackInterval(enemyData, [])
  └─ on attack: CombatSystem.resolveHit(enemyAsAttacker, target)

Tower.js
  ├─ stats: simple inline data (no JSON file yet)
  └─ on fire: projectile carries tower's attackStat + accuracyRatio

CombatSystem.js  ← NEW
  ├─ resolveHit(projectile, target)
  ├─ calcChanceToHit(accuracyRatio, targetEvasion)
  ├─ calcEvasion(totalWeight, totalPowerOutput)
  ├─ calcDamage(attackStat, defenseStat)
  ├─ selectTargetPart(target)
  ├─ calcAttackInterval(weaponData, globalMods)
  └─ calcMoveSpeed(baseSpeed, weight, power, addMods, statusMults)
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Existing projectile collision in `Game.js` is not well-isolated — might be spread across update loops | Audit `Game.js` before implementation; extract collision resolution into a clear section |
| Fixed-point math (10000-based) is easy to get wrong — off-by-one exponent errors | Unit-test `CombatSystem` functions in isolation with known inputs from `Formulas.md` |
| Shotgun Fan spread angle not defined precisely in current docs | Define spread angle constant in `Config.js` (e.g., 15° total spread across N pellets) |
| 4 weapon ranges drawn simultaneously may be visually noisy | Render all ranges at low opacity; on active fire, briefly brighten that slot's range circle |
