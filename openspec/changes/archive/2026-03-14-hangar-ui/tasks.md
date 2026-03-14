## 1. Setup & Data Foundation

- [x] 1.1 Extract core stat calculation logic (Total Weight, Power Output, Move Efficiency, Evasion, etc.) from `Mech.js` into a shared utility function so both engine and UI can reference it.
- [x] 1.2 Update `PlayerProfile.js` to parse `parts.json` and `weapons.json` at initialization and populate the `inventory` (stash) with one of every valid item to facilitate testing.

## 2. Base Interaction & UI Skeleton

- [x] 2.1 Update `BaseScene.js` to listen for an LMB click specifically on the Hangar Console entity.
- [x] 2.2 Upon click, emit an event to `UIManager` to open the `HangarScreen` and pause player movement/interactions in the BaseScene.
- [x] 2.3 Create `src/ui/screens/HangarScreen.js` (extending `BaseScreen`) with a basic `mount` DOM structure containing the 2-column layout.
- [x] 2.4 Create the CSS styles (`.hangar-overlay`, `.visual-pane`, `.engineering-pane`, `.stats-panel`, etc.) according to the agreed upon design.

## 3. State Management & Loadout Rendering

- [x] 3.1 In `HangarScreen.js`, establish a "working state" locally by deep-cloning `PlayerProfile.loadout` and `inventory`.
- [x] 3.2 Implement the "Current Loadout" list rendering to show all 4 core parts and 4 weapon slots based on the working state.
- [x] 3.3 Implement click listeners on these slot list items to set the "active slot filter".
- [x] 3.4 Wire up the Visual Preview section on the left to display the currently equipped "working state" parts.

## 4. Inventory Filtering & Projection

- [x] 4.1 Based on the currently clicked loadout slot, filter the working `inventory` stash down to valid matching items (e.g., matching `partType` or Grip/Shoulder).
- [x] 4.2 Render this filtered list in the "All Owned Items" panel.
- [x] 4.3 Add hover listeners to the stash items; on hover, recalculate the "Projected" stat column in the Real-Time Stats panel against the working loadout.

## 5. Deployment Constraints Validation

- [x] 5.1 Implement the continuous validation logic: check that all 4 core parts are equipped.
- [x] 5.2 Add validation logic: check that at least 1 weapon is equipped.
- [x] 5.3 Add validation logic: check that calculated Total Weight $\le$ Total Power Output.
- [x] 5.4 If any constraint fails, disable the "Deploy" button and render the corresponding error message into the stat panel footer.

## 6. Commitment & Integration

- [x] 6.1 Implement click behavior on stash items to actually execute the swap in the working state (moving equipped part back to inventory, bringing clicked part to loadout).
- [x] 6.2 Wire the "Deploy" button to overwrite `PlayerProfile` singletons with the working state and unmount the screen.
- [x] 6.3 Ensure that when returning to the `BaseScene`, the player's mech is instantiated properly using the new loadout.

## 7. Bug Fixes (Post-Implementation Review)

- [x] 7.1 Fix crash: `currentEquippedId` is declared with `const` inside the weapon-only `if` block in `renderStashList`, but referenced outside it — causes a `ReferenceError` whenever a part slot (body, legs, arm) is clicked.
- [x] 7.2 Fix memory leak: `addListener` calls in `renderLoadoutList` and `renderStashList` append to `this.eventListeners` on every re-render without cleanup. Add a separate dynamic listener array that is cleared before each list re-render.
- [x] 7.3 Fix latent crash: hover projection in `renderStashList` does `potential[keys[0]].id = item.id` without a null guard — throws if the part slot object is absent.
- [x] 7.4 Clarify projected constraint feedback: when `validateDeploymentConstraints` is called during a hover preview, prefix the weight capacity error with `[PROJECTED]` instead of `ERROR:` to make clear the working loadout is not yet broken.
