# Proposal: Implement Mech Parts

## Why
Currently, the `Mech` class is a monolithic entity with a single flat HP property. According to the design specifications defined in `openspec/design_src/`, the Mech should be a composite entity made up of four distinct destructible parts (Body, Left Arm, Right Arm, Legs), plus mounting points for active weapons. 

This change is necessary to align the codebase's model of the player character with the actual design rules. By segmenting the Mech, we unlock the core combat mechanics of part destruction, penalty application, and accurate damage calculations across isolated defense values.

## What Changes
We will transition the `Mech` class architecture from a monolithic structure to a composite structure containing distinct data models for parts.

Specifically, this change will implement:
- **Part Models:** Introduction of dedicated tracked data structures for Body, Left Arm, Right Arm, and Legs.
- **Specific Hit Logic:** Replacing whole-body damage processing with logic that targets specific parts. 
- **Mission Criticality:** The mission loss condition will be restricted exclusively to when the **Body** HP hits 0 ("Total HP" will be removed).
- **Destruction Penalties:** 
  - When an Arm reaches 0 HP, any Grip or Shoulder weapons attached to that arm become completely unusable.
  - When the Legs reach 0 HP, an initial hardcoded multiplier (`DestroyedSpeedModifier = 5000`) will be applied to the Mech's movement speed. *Note*: This static 5000 modifier is a placeholder that will later pull from `SystemConstants.xlsx`, but for this stage, it will be strictly coded to respect a 10000 base integer formula.
- **Weapon Mapping Boundaries:** Implementing the capability for each arm to technically mount up to 1 Grip weapon and 1 Shoulder weapon, limited by part validity and weight constraints (though full inventory UI validation is out of scope for this immediate sub-task, the capability for the arm to mount these will exist).

## New Capabilities
N/A

## Modified Capabilities
- `mech-core`: The base definition of what constitutes a Mech, its stats, and its death condition.
- `combat`: The logic dictating how incoming attacks are mapped to specific defense pools, rather than a global pool.
- `mech-movement`: The logic dictating how speed is calculated (incorporating `DestroyedSpeedModifier` on Legs destruction).

## Impact
- **Impacted Systems:** `Mech.js` (core restructuring), `Game.js` (death condition loop), `Terminal.js`/UI wrappers (HP visualization will now need to account for multiple parts instead of rendering one bar).
