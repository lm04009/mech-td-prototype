# hangar-ui Specification

## Purpose

The Hangar UI provides a screen for players to inspect and modify their mech loadout between deployments, with real-time stat projection and deployment validation.

## Requirements

### Requirement: Layout Structure
The Hangar UI MUST present a two-column functional layout overlaying the screen.

#### Scenario: Visual Structure
- **WHEN** the `HangarScreen` opens
- **THEN** it MUST render a visual preview and summary of the current loadout on the left
- **AND** it MUST render an engineering panel with slot selection, valid inventory list, and stat comparisons on the right.

### Requirement: Interactive Slot Filtering
Selecting a loadout slot MUST filter the inventory panel to show only valid replacement parts.

#### Scenario: Slot Selection
- **WHEN** the player clicks a specific slot (e.g., `Left Arm`, or `W2 R (Shoulder)`)
- **THEN** the inventory panel MUST display only items from the stash `inventory` that are valid for that slot
- **AND** hovering over an inventory item MUST display the real-time stat comparison for that swap.

### Requirement: Unequipping Weapons
The UI MUST allow players to explicitly empty a weapon slot, returning the weapon to their inventory stash.

#### Scenario: Emptying a Weapon Slot
- **WHEN** the player selects a weapon slot (e.g., `W1 L (Grip)`)
- **THEN** the filtered inventory list MUST include an "Unequip" or "Empty Slot" option at the top of the list
- **AND** selecting this option MUST remove the weapon from the working loadout and return it to the stash.

#### Scenario: Core Parts Cannot Be Empty
- **WHEN** the player selects a core part slot (Body, Legs, ArmL, ArmR)
- **THEN** the filtered inventory list MUST NOT include an "Unequip" option, as core parts can only be swapped, never left empty.

### Requirement: Real-Time Stats Calculation
The UI MUST recalculate and project the mech's total stats before the player commits to a deployment.

#### Scenario: Stat Projection Update
- **WHEN** the player hovers over or equips an item in the working loadout
- **THEN** the `HangarScreen` MUST dynamically calculate the "Projected" stat column using the formulas for Max HP, Speed %, Capacity, and Evasion.

### Requirement: Deployment Constraints
The UI MUST prevent deployment if the working loadout is invalid according to mechanical constraints.

#### Scenario: Core Part Missing
- **WHEN** the working loadout is missing one of the 4 core parts (Body, Left Arm, Right Arm, Legs)
- **THEN** the "Deploy" button MUST be disabled and an error message displayed.

#### Scenario: Zero Weapons Equipped
- **WHEN** the working loadout has 0 weapons equipped
- **THEN** the "Deploy" button MUST be disabled and an error message displayed.

#### Scenario: Capacity Exceeded
- **WHEN** the calculated `Total Weight` is strictly greater than `Total Power Output`
- **THEN** the "Deploy" button MUST be disabled and an error message displayed.
