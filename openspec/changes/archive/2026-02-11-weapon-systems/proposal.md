# Proposal: Weapon Systems

## Why

The mech can move, but it cannot fight. To validate the "Active Pilot" and "Weapon Range" hypotheses, we need to implement the ability to fire weapons and inflict damage.

## What Changes

We will implement:
- **Mouse Aiming:** Mech (or at least its weapons) rotates to face the mouse cursor.
- **Weapon Firing:** Left-click fires the active weapon.
- **Projectiles:** Bullets/shots travel in a straight line.
- **Range Enforcement:** Weapons only fire if the cursor is within their defined range (visualized by a circle).

## Capabilities

### Modified Capabilities
- `mech-movement`: Update `InputHandler` to track mouse position. Update `Mech` to handle rotation.

### New Capabilities
- `weapon-system`: `Weapon` class, `Projectile` class, firing logic.
- `mechanics-range`: Visual range indicator and fire inhibition.

## Impact

- **New:** `src/game/weapon.js`, `src/game/projectile.js`
- **Modify:** `src/game/input.js` (add mouse), `src/game/mech.js` (attach weapons)

## Success Criteria

- Mech weapons face the mouse cursor.
- Left-click fires a projectile.
- Projectiles travel and despawn.
- **Range Key:** You cannot fire if the mouse is outside the weapon's range.
