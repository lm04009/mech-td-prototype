## 1. Tooling & Environment
- [ ] 1.1 Create `package.json` in the project root to manage dependencies (`xlsx`).
- [ ] 1.2 Install `xlsx` package.
- [ ] 1.3 Create the converter script `scripts/convert-design-data.js`.
- [ ] 1.4 Add a `bake-data` script to `package.json`.

## 2. Execution & Verification
- [ ] 2.1 Run the converter script and verify that `src/data/` is populated with the corresponding JSON files.
- [ ] 2.2 Inspect the generated JSON files to ensure data types (numbers, strings) are correct and empty Excel rows are filtered out.
- [ ] 2.3 Perform a "Round Trip" test: Modify a value in `MechParts.xlsx`, run the bake command, and verify the value is updated in `src/data/parts.json`.
