# Proposal: Lane Generator System

## Problem
Currently, lanes are hardcoded straight lines that ignore terrain.
1.  They clip through walls/water.
2.  Sockets are placed manually and often don't align with the path or are blocked by walls.
3.  Maps cannot be easily changed without breaking everything.

## Solution
Implement a **Lane Generator** that runs at level start (or initialization).
1.  **Pathfinding**: Calculates valid paths from Spawners to Terminal using A* (respecting Walls/Water).
2.  **Socket Placement**: Automatically places sockets along the generated path in valid, strategic spots.
3.  **Blight Mechanics**: Validates that lanes and sockets follow the "Root" logic (connected, sequential).

## Capabilities
-   **New**: `LaneGenerator` class.
-   **Update**: `GameMap` to load generated lanes.
-   **Update**: `EncounterManager` to use generated lanes.

## Constraints
-   **Run Once**: Pathfinding happens *before* gameplay (Level Gen).
-   **Static Paths**: Enemies follow the pre-calculated array. No runtime pathfinding.
-   **Impassable Sockets**: The generator treats Sockets as WALLS. Lanes cannot cross them.
