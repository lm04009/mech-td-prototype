# Delta Spec: combat (combat-foundation)

## MODIFIED Requirements

### Requirement: Weighted Target Selection

Damage MUST NOT be applied generally, but instead must target a specific part based on a weighted distribution.

#### Scenario: Incoming hit calculation
- **WHEN** a projectile successfully strikes the Mech's collider
- **THEN** the targeted part is determined via RNG using a 1:2:2:3 weight ratio (Body: 1, Left Arm: 2, Right Arm: 2, Legs: 3).
- **AND** this resolution MUST occur inside `CombatSystem.resolveHit()`, not inside `Mech.js` or any caller.

### Requirement: Hit Target Reroll

If a destroyed part is selected as a target by an attack, the target MUST be re-selected uniformly from among all remaining non-destroyed parts.

#### Scenario: Hit on destroyed part
- **WHEN** a projectile rolls a hit against a part that already has 0 HP
- **THEN** the attack target is re-selected from a pool of parts with > 0 HP
- **AND** each valid part in that pool is given an equal weight of 1
- **AND** the damage multiplier uses the newly selected part's defense.

### Requirement: Multi-Projectile Weapons

Weapons with `ProjectilesPerRound > 1` MUST spawn the correct number of projectiles per fire event. The firing mode (sequential or simultaneous) is determined by the `SequentialFire` field in `weapons.json` — it is independent of `DeliveryType`, which is a spatial descriptor only.

#### Scenario: Sequential (burst) fire — SequentialFire = 1
- **WHEN** a weapon with `SequentialFire = 1` fires (e.g., Machinegun A with 6 rounds, Missile Launcher A with 3)
- **THEN** round 1 is spawned immediately at the moment of player input
- **AND** the FinalAttackInterval cooldown starts at round 1 (not after the last round)
- **AND** rounds 2–N are spawned one-by-one, each separated by `IntraBurstInterval` ms (from `constants.json`)
- **AND** the aimed direction is locked at trigger time — subsequent burst rounds travel the same direction regardless of mech rotation
- **AND** if the arm is destroyed mid-burst, remaining queued rounds are silently cancelled

#### Scenario: Simultaneous fire — SequentialFire = 0
- **WHEN** a weapon with `SequentialFire = 0` and `ProjectilesPerRound > 1` fires (e.g., Shotgun A)
- **THEN** ALL projectiles are spawned at the exact same moment with no intra-burst delay

#### Scenario: Fan delivery (Shotgun)
- **WHEN** a weapon with `DeliveryType = "Fan"` fires
- **THEN** projectiles are spread across a defined arc angle (`FAN_SPREAD_DEGREES` from Config)
- **AND** each projectile carries the same accuracy and damage stats

## ADDED Requirements

### Requirement: Unified Combat Resolution

All damage dealt by any entity MUST pass through `CombatSystem.resolveHit()`. No entity class may implement its own damage calculation.

#### Scenario: Player projectile hits enemy
- **WHEN** a player projectile collides with an enemy
- **THEN** `CombatSystem.resolveHit(projectile, enemy)` is called
- **AND** a `ChanceToHit` roll is performed before any damage is applied
- **AND** if the roll fails, no damage is applied

#### Scenario: Enemy attacks Mech
- **WHEN** an enemy's attack timer fires and a valid target is in range
- **THEN** `CombatSystem.resolveHit(enemyAttackerData, mechTarget)` is called
- **AND** the same `ChanceToHit` roll and damage formula apply

#### Scenario: Tower projectile hits enemy
- **WHEN** a tower projectile collides with an enemy
- **THEN** `CombatSystem.resolveHit(projectile, enemy)` is called
- **AND** the same rules apply as for player projectile hits

### Requirement: Accuracy / Evasion Roll

Every attack MUST have a chance to miss based on the attacker's accuracy and the target's evasion.

#### Scenario: Hit roll calculation
- **WHEN** `CombatSystem.resolveHit()` is called
- **THEN** `ChanceToHit = max(AttackerAccuracyRatio / (10000 + DefenderEvasion), 0.05)`
- **AND** a random number in [0, 1) is generated and compared against `ChanceToHit`
- **AND** if the random number >= `ChanceToHit`, the attack misses and no damage is applied
- **AND** minimum hit chance of 5% (0.05) is always guaranteed

#### Scenario: Player weapon accuracy
- **WHEN** a player weapon fires
- **THEN** the spawned projectile carries the weapon's `AccuracyRatio` from `weapons.json`
- **AND** the arm part's `AccuracyRatio` from `parts.json` is combined multiplicatively: `floor(weaponAccuracy * armAccuracy / 10000)`

### Requirement: Damage Formula

All damage MUST use the mitigation formula from `Formulas.md`.

#### Scenario: Damage calculation
- **WHEN** an attack successfully hits
- **THEN** `MitigationMultiplier = Attack / (Attack + Defense)`
- **AND** `FinalDamage = max(1, round(Attack * MitigationMultiplier))`
- **AND** `Attack` is the attacker's weapon/entity Attack stat
- **AND** `Defense` is the Defense stat of the specific part hit (for Mech) or the flat Defense stat (for enemies)

### Requirement: Attack Interval Formula

All entities MUST derive their attack timing from the `TypeAttackInterval` formula. No hardcoded cooldown values are permitted.

#### Scenario: Weapon attack interval
- **WHEN** a weapon fires
- **THEN** its refire interval is: `floor(TypeAttackInterval * 10000 / (10000 + LocalAttackSpeedMod))`
- **AND** global attack speed modifiers are then applied: `floor(WeaponAttackInterval * 10000 / (10000 + sum(GlobalAttackSpeedMods)))`
- **AND** the FinalAttackInterval timer MUST start on the first projectile spawn

### Requirement: Shield — Automatic Active/Cooldown Cycle

Shields do not require player input. They run an automatic active→cooldown→active cycle independently on each arm they are equipped on.

#### Scenario: Shield active window
- **WHEN** a Shield weapon is equipped on a living arm
- **THEN** it begins in the active state, providing its `Defense` bonus to the **whole mech** for all incoming hits (not just the arm it is mounted on)
- **AND** the active window lasts `SHIELD_ACTIVE_DURATION_MS` (currently 5000 ms; TODO: pull from weapon data when field is defined)
- **AND** the active window is visible to the player via a HUD bar draining and a body glow effect on the mech

#### Scenario: Shield cooldown
- **WHEN** the active window expires
- **THEN** the shield enters cooldown for `TypeAttackInterval` ms (from `weapons.json`)
- **AND** during cooldown the defense bonus is NOT applied
- **AND** after cooldown expires the shield automatically becomes active again

#### Scenario: Shield defense scope
- **WHEN** any part of the Mech is hit while one or more shields are active
- **THEN** each active shield's `Defense` stat is added to the hit part's own Defense before the damage formula runs
- **AND** multiple active shields stack additively

### Requirement: Enemy Attack Range — Surface Distance

Enemy attack range checks MUST use the distance from the enemy center to the **nearest surface** of the target, not center-to-center distance.

#### Scenario: Melee enemy attacks Terminal
- **WHEN** a melee enemy reaches the edge of the Terminal (a rectangular target)
- **THEN** the attack range check uses nearest-point-on-rect distance, not center distance
- **AND** this ensures melee enemies that physically touch the Terminal edge are within range

#### Scenario: Melee enemy attacks Mech
- **WHEN** a melee enemy reaches the edge of the Mech (a circular target)
- **THEN** the attack range check uses `center_distance - target.radius`, not center distance
- **AND** larger targets are easier to hit (closer surface), not harder

### Requirement: Data-Driven Enemy Stats

Enemy entities MUST be initialized from `enemies.json` data. No hardcoded stat branches are permitted.

#### Scenario: Enemy spawned by EncounterManager
- **WHEN** `EncounterManager` spawns an enemy for a wave event
- **THEN** the enemy's stats (HP, Attack, Defense, AccuracyRatio, RangeMax, ProjectilesPerRound) come from the matching `enemies.json` entry
- **AND** the entry is matched by the `enemyType` field in the wave event data
