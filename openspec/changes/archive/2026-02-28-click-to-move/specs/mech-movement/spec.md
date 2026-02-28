# mech-movement Delta Spec

## Changes from main spec

The `mech-movement` capability is fully replaced by `click-to-move`. All WASD requirements are removed.

### REMOVED Requirements

- **Directional Movement** (WASD input): The Mech no longer moves in response to W/A/S/D keypresses.
- **Input Release** (velocity decay): There is no player-driven velocity vector. Movement direction is determined by A* waypoints.
- **Position Update via player velocity**: The old spec modelled `Position += Velocity × DeltaTime` where Velocity was a player-controlled direction. This is replaced. The arithmetic is identical (`position += direction × mech.speed × dt`), but direction now comes from the computed path, not player input. Speed and DeltaTime are still fully applied.

### REPLACED WITH

See `../specs/click-to-move/spec.md` for the full replacement specification.

The new model: player clicks ground → A* path computed → mech steers toward waypoints at `mech.speed` → stops at destination.
