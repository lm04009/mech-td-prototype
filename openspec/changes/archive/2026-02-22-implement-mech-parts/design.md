# Design: Implement Mech Parts

## Context
Currently, `Mech.js` tracks a single, monolithic pool of HP. The design specs mandate that the Mech is constructed from 4 distinct destructible parts (Body, Left Arm, Right Arm, Legs), each with individual stats (HP, Defense, Weight, etc.). The mission fails ONLY when the Body reaches 0 HP. Reaching 0 HP on other parts imposes severe penalties (weapon locking, speed reduction). 

## Goals / Non-Goals

**Goals:**
- Replace the monolithic HP system with a composite part-based system.
- Implement part-specific hit logic using a weighted probability system.
- Enforce the "Body 0 HP = Mission Failed" mechanic.
- Implement the DestroyedSpeedModifier (placeholder `5000` on a 10000 scale) for the legs.
- Ensure weapons on a destroyed arm are disabled.
- Define a structured data model in the codebase to hold these stats.

**Non-Goals:**
- Validating total carrying capacity vs power output in a loadout/inventory UI (out of scope for now).
- Visual damage states / sprite destruction animations.
- Implementing the "chance to hit/miss" accuracy formulas yet (we are just structuring the parts and HP logic first).

## Decisions

### 1. Target Selection Logic (Weighted Probability)
When a projectile successfully hits the Mech's collider, the exact part hit is determined by a weighted RNG roll, specifically using a 1:2:2:3 ratio:
- **Body (胴):** 1 weight (12.5%) - Statistically protected to prevent premature "Game Over."
- **Left Arm:** 2 weight (25%) - High chance to "Defang" the unit by disabling weapons.
- **Right Arm:** 2 weight (25%)
- **Legs (脚):** 3 weight (37.5%) - Highest single-part weight to encourage immobilization.

*Overflow Logic:* If a projectile rolls a part that is already at `0 HP` (Destroyed), the hit target is instead selected randomly from the remaining non-destroyed parts. During this target reroll, each remaining part is given an equal probability weight of 1.

### 2. Part Data Structuring
Inside `Mech.js` (and potentially creating a lightweight `MechPart` class/factory), the state will hold:
```javascript
this.parts = {
    body: { name: 'Body A', hp: 24, maxHp: 24, defense: 8, ... },
    armLeft: { name: 'Arm A', hp: 19, maxHp: 19, defense: 9, ... },
    armRight: { name: 'Arm B', hp: 22, maxHp: 22, defense: 12, ... },
    legs: { name: 'Legs A', hp: 20, maxHp: 20, defense: 10, ... }
};
```
*Note: For this implementation, we will inject initial hardcoded values representing a default loadout directly mapped from your excel sheets, to test the systems immediately without building a full inventory parser.*

### 3. Destruction Penalty Implementation
- **Legs / Movement System:** Inside the Mech's physics update or speed getter, we will check `this.parts.legs.hp`. If it is `<= 0`, we multiply the resulting speed by `5000 / 10000`.
- **Arms / Combat System:** The weapon firing loop will check the HP of the arm a weapon is assigned to. If `hp <= 0`, that weapon's firing conditions will fail.

## Risks / Trade-offs

- **HUD Update Required:** The UI currently assumes `player.hp` and `player.maxHp`. The `UIManager` and `HUD.js` will need to be refactored to visualize all 4 parts, or the game will look broken to the player.
