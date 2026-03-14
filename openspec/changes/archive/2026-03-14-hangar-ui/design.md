## Context

The Hangar UI allows players to configure their mech's loadout (parts and weapons) between combat encounters. Customization is an engineering exercise where the player must balance the weight of equipment against the power output of their chassis and legs. The previous decision to use an ARPG drag-and-drop system was discarded in favor of a slot-by-slot list-based approach (akin to Front Mission or Armored Core) to prioritize side-by-side stat analytics and clear constraint communication.

## Goals / Non-Goals

**Goals:**
- Implement a two-column UI layout consisting of a visual preview section (Left) and a loadout engineering panel (Right).
- Provide immediate, projected stat deltas (e.g., `-8% Speed`) when hovering over items in the inventory stash.
- Enforce strict deployment constraints (All core parts equipped, $\ge$ 1 weapon equipped, Weight $\le$ Power Output).
- Temporarily populate the player's stash with one of every part from `parts.json` and `weapons.json` for testing.

**Non-Goals:**
- Implementing economy features (purchasing parts with credits or loot drops). 
- Changing loadout mid-combat.
- Drag-and-drop inventory interactions.

## Decisions

**1. Data Flow & State Management**
When the `HangarScreen` opens, it will create a deep copy of the `PlayerProfile.loadout` to act as the "working loadout". All part swaps happen against this working loadout so the player can experiment safely. The state is only written back to `PlayerProfile` when the player clicks the "Deploy" (or Confirm/Close) button.

**2. Visual Configuration Flow**
- In the "Current Loadout" panel, players click on a slot (e.g., `[ W2 R ]`).
- This sets the active filter state.
- The adjacent "All Owned Items" panel dynamically populates with items from the stash `inventory` that match the required type for that slot (e.g. `Type: Shoulder`). 
- Hovering an item calculates the "Projected" stat column. Clicking an item equips it to the working loadout and returns the old part to the stash list. 

**3. Constraint Enforcement Engine**
The constraints (Weight limitations, minimum part requirements) will be calculated continuously by a `validateLoadout(workingLoadout)` function inside the screen's UI logic. If `isValid === false`, the "Deploy" button is visually disabled (greyed out), and a specific error string is presented in the bottom panel (e.g., `[ERROR: Capacity Exceeded]`).

**4. Visual Preview Rendering**
The visual preview on the left side of the Hangar Screen will utilize an HTML5 `<canvas>` element. Unlike the in-game top-down perspective, the Hangar requires a dedicated "front-facing" sprite drawing routine (similar to Front Mission displays). We will write specific rendering functions that draw the geometric representations of the Body, Legs, Arms, and Weapons in a front-facing layered orthographic view according to the current working loadout. Empty weapon slots will locally bypass their drawing step.

## Risks / Trade-offs

- **[Risk]** The math formulas in `Formulas.md` for Speed and Evasion rely on integer math constraints and clamped thresholds, which might be tricky to recalculate cleanly outside of the main Combat engine.
  $\rightarrow$ **Mitigation**: Extract the core stat calculation logic from the `Mech` class into a shared pure function `calcMechStats(loadoutData)` that both the `Mech` entity and the `HangarScreen` UI can import and use to guarantee consistency.
