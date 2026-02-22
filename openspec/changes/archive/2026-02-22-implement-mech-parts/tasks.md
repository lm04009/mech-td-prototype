## 1. Core Data Models

- [x] 1.1 Update `Mech.js` constructor to initialize the 4 distinct parts (Body, Left Arm, Right Arm, Legs) with hardcoded default stats representing `openspec/design_src/` baseline.
- [x] 1.2 Remove the monolithic `hp` and `maxHp` properties from the `Mech` class structure, replacing all internal references to the new `parts.body` HP.
- [x] 1.3 Update `Game.js` loop to check `Mech.parts.body.hp <= 0` instead of `Mech.hp <= 0` to trigger Game Over.

## 2. Damage & Combat System

- [x] 2.1 Implement a `processHit(attackerAttackStat, sourceEntity)` or similar function in `Mech.js` that selects the targeted part using the 1:2:2:3 RNG weighting (Body: 1, Left Arm: 2, Right Arm: 2, Legs: 3) FIRST before calculating any damage.
- [x] 2.2 Implement overflow logic inside `processHit` to redirect hits on destroyed parts (0 HP) directly to the Body, so that the mitigation multiplier uses the Body's Defense stat and the final scalar damage is calculated against the Body.
- [x] 2.3 Refactor the enemy projectile hit mapping so that collision with the Mech invokes this new `processHit` handler instead of standard monolithic subtraction.

## 3. Penalty Enforcement

- [x] 3.1 Update the Mech's movement calculation to apply `DestroyedSpeedModifier` (5000 / 10000 multiplier) if `parts.legs.hp <= 0`.
- [x] 3.2 Update the Mech's weapon tracking so weapons track which Arm they are seated on.
- [x] 3.3 Block the firing mechanism of Grip/Shoulder weapons if their corresponding Arm part's HP is <= 0.
