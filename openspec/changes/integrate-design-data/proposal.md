# Proposal: Integrate Design Data

## Why
Currently, the game uses hardcoded stats for the Mech and enemies. This makes it difficult to iterate on game balance, as changes require modifying the source code directly. The designer has provided Excel spreadsheets (`.xlsx`) in `openspec/design_src/` containing the actual target data and formulas. We need a way to bring this data into the game in a controlled, performant, and version-controlled manner.

## What Changes
- **Dependency Management**: Initialize a `package.json` to manage the `xlsx` Node package.
- **Converter Script**: Create a Node.js utility (`scripts/convert-design-data.js`) designed to:
    - Load `.xlsx` files from `openspec/design_src/`.
    - Parse specific workbooks (`Enemies`, `MechParts`, `MechWeapons`, `SystemConstants`).
    - Output sanitized `.json` files to `src/data/`.
- **Command Entry**: Add a "script" to `package.json` so the user can easily run the conversion (e.g., `npm run bake-data`).

## New Capabilities
- `data-baking-pipeline`: A repeatable, automated tool to bridge Excel design work with the game's JSON-based runtime.

## Modified Capabilities
N/A (This task is focused purely on tooling and data preparation).

## Impact
- **Impacted Systems**: No game runtime systems are impacted yet. This is a foundational tooling change.
- **Environment**: Adds Node.js dependency management (`package.json`, `node_modules`).
