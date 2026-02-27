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

### Requirement: Multi-Projectile Weapons

Weapons with `ProjectilesPerRound > 1` MUST spawn the correct number of projectiles per fire event.

#### Scenario: Burst fire weapon
- **WHEN** a weapon with `ProjectilesPerRound = 6` fires (e.g., Machinegun A)
- **THEN** exactly 6 projectiles are spawned at the moment of firing

#### Scenario: Fan delivery (Shotgun)
- **WHEN** a weapon with `DeliveryType = "Fan"` fires
- **THEN** projectiles are spread across a defined arc angle
- **AND** each projectile carries the same accuracy and damage stats

### Requirement: Data-Driven Enemy Stats

Enemy entities MUST be initialized from `enemies.json` data. No hardcoded stat branches are permitted.

#### Scenario: Enemy spawned by EncounterManager
- **WHEN** `EncounterManager` spawns an enemy for a wave event
- **THEN** the enemy's stats (HP, Attack, Defense, AccuracyRatio, RangeMax, ProjectilesPerRound) come from the matching `enemies.json` entry
- **AND** the entry is matched by the `enemyType` field in the wave event data
