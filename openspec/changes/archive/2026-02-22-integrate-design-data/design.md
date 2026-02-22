# Design: Integrate Design Data

## Context
We are moving from hardcoded balance to an Excel-driven design workflow. The primary technical challenge is that `.xlsx` files cannot be read directly by the browser (efficiently), and they are binary files that are hard to track in Git diffs. 

## Goals / Non-Goals

**Goals:**
- Automate the conversion of `.xlsx` -> `.json`.
- Ensure data is sanitized (stripping empty rows, converting types).
- Provide a simple command-line interface for the user.

**Non-Goals:**
- Implementing game formulas (`MoveEfficiency`, etc.) in JS.
- Refactoring `Mech.js` or `Enemy.js` to load the data.

## Decisions

### 1. Data Mapping & Output Structure
The converter will produce concentrated JSON files in `src/data/`:
- **`parts.json`**: Groups data from `MechParts.xlsx`. Keys are sheet names (e.g., `Body`, `Arm`, `Legs`).
- **`weapons.json`**: Groups data from `MechWeapons.xlsx`. Keys are sheet names (e.g., `Grip`, `Shoulder`).
- **`enemies.json`**: Contains the list of enemies from `Enemies.xlsx`.
- **`constants.json`**: Contains global values from `SystemConstants.xlsx`.

### 2. The Parsing Algorithm
For every spreadsheet, the script will:
1.  **Filter Sheets**: Ignore any sheet whose name starts with `#` (e.g., `#説明`).
2.  **Row Mapping**:
    - **Header Identification**: Use the **2nd row** (index 1) as the JSON property names.
    - **Type Row**: Skip the **3rd row** (index 2) which contains data type labels (`uint`, `string`, etc.).
    - **Data Rows**: Process all rows from the **4th row** (index 3) onwards.
3.  **Column Filtering**: Ignore any column where the header (Row 1) starts with `#`.
4.  **Sanitization**: 
    - Skip completely empty rows.
    - Ensure numerical values are stored as `Number` types in JSON, not strings.
5.  **Grouping**: In files like `parts.json`, create a top-level object where each key is a sheet name, and the value is the array of processed items from that sheet.

## Risks / Trade-offs
- **Breaking Changes:** If the Excel column names change, the converter or the game code might break. We will use flexible property mapping where possible.
- **Dependency:** Project now requires Node/npm for the development workflow (conversion).
