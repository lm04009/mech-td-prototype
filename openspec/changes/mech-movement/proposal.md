proceed# Proposal: Mech Movement

## Why

The player is currently a disembodied observer. To validate the "Active Mech" gameplay, we need to give the player control over a tangible unit in the world.

## What Changes

We will implement:
- **Mech Rendering:** Visual representation of the mech (Torso + Legs + Arms) on the canvas.
- **Input Handling:** Keyboard (WASD) input to control velocity and facing.
- **Movement Physics:** Basic position updates based on velocity, constrained by map boundaries (for now).

## Capabilities

### Modified Capabilities
- `project-scaffolding`: Update `main.js` to integrate the game loop with input and mech updates.

### New Capabilities
- `mech-movement`: WASD control, rotation towards mouse (optional for v0, but good for "active" feel).
- `input-system`: meaningful input mapping.

## Impact

- **New:** `src/game/mech.js`, `src/game/input.js`
- **Modify:** `src/main.js`

## Success Criteria

- Pressing WASD moves the mech on screen.
- The mech has a visible front/direction.
- Movement feels responsive.
