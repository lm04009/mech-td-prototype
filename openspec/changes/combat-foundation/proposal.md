# Proposal: combat-foundation

## Why

Combat has never been properly implemented. What exists is a collection of ad-hoc placeholder values — hardcoded damage numbers, hardcoded cooldowns, no accuracy rolls, no data integration — assembled independently and inconsistently across three different entity types (Mech, Enemy, Tower).

More critically, the current code violates the core design intent: **the same combat rules apply to all entities**. Instead, each entity has its own bespoke attack logic with no shared foundation. This makes it impossible to implement the actual formulas (attack interval, accuracy/evasion, damage mitigation, move efficiency) consistently, and guarantees they will drift as the codebase grows.

The data files (`weapons.json`, `parts.json`, `enemies.json`) have rich, well-designed stat definitions. None of it is loaded or used by any runtime code.

This must be fixed before any further combat-adjacent work. Everything downstream — weapon variety, mech customization, enemy difficulty tuning, tower balancing — depends on a correct, unified foundation.

## What

Establish the unified combat foundation:

1. **Unified `CombatSystem`** — a single module containing all combat formulas (`resolveAttack`, `calcAttackInterval`, `calcMoveSpeed`, `calcEvasion`). All entities delegate to it; none implement their own combat logic.

2. **Data-driven entities** — Mech, Enemy, and (minimally) Tower are initialized from JSON data rather than hardcoded constants. A fixed starting loadout for the Mech is defined in data.

3. **Correct Mech weapon slot structure** — The Mech has 4 weapon slots: Left Arm Grip, Left Arm Shoulder, Right Arm Grip, Right Arm Shoulder. Each fires independently on its assigned input binding (RMB, 1, 2, 3). Arm destruction disables both slots on that arm.

4. **Accuracy / evasion rolls** — `ChanceToHit` is resolved at the point of projectile collision, using the attacker's accuracy and the target's evasion (derived from weight/power ratio for the Mech).

5. **Attack interval formula** — All weapons use `TypeAttackInterval` modified by `LocalAttackSpeedMod` and global mods, replacing all hardcoded cooldown values.

6. **Multi-projectile support** — Weapons with `ProjectilesPerRound > 1` correctly spawn multiple projectiles per fire event. Fan delivery type (shotgun spread) is supported.

7. **Range display** — All equipped weapon range circles are rendered simultaneously.

## New Capabilities

- `combat` (delta spec — significant expansion of existing stub)
- `mech-core` (delta spec — 4-slot weapon structure, data-driven initialization)
- `weapon-ranges` (delta spec — 4-slot range display, Fan delivery type)

## Impact

- `src/game/mech.js` — major restructuring (4 slots, data-driven, delegates to CombatSystem)
- `src/game/enemy.js` — data-driven initialization from enemies.json, delegates to CombatSystem
- `src/game/tower.js` — delegates to CombatSystem for attack resolution
- `src/game/weapon.js` — replaced/extended; slot-based cooldown state
- `src/game/projectile.js` — carries attacker accuracy stat; resolves hit/miss on collision
- `src/game/Game.js` — updated projectile collision handling to call CombatSystem
- `src/game/EncounterManager.js` — loads enemy type from enemies.json
- `src/engine/CombatSystem.js` — new file (all formulas)
- `src/data/weapons.json`, `parts.json`, `enemies.json` — now consumed at runtime

## Success Criteria

- A single `CombatSystem.resolveAttack()` is the only place damage is calculated for any entity
- All weapon cooldowns derive from `TypeAttackInterval` + mods; no hardcoded cooldown values remain
- Projectile hits perform an accuracy roll before dealing damage
- Mech has 4 weapon slots, each fires on its assigned input, each shows its range circle
- Enemy stats match `enemies.json` entries; tower damage is resolved through `CombatSystem`
- Destroying an arm disables both Grip and Shoulder slots on that arm
- Melee/Swing delivery type is explicitly deferred (not broken, just unimplemented)
