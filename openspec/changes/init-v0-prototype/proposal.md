# Proposal: Init v0 Prototype

## Why

The goal of the prototype is **design validation**, not polish or completeness. Specifically, it must answer:

- Does *Blight‑style TD + an actively piloted unit* work when the unit is a **Front Mission–style mech** with parts and weapon ranges?
- Do **terrain constraints and map layout** meaningfully affect tactics?

## What Changes

To enable this validation, we will implement the **v0 prototype** as a static browser-based game (HTML/JS/Canvas).

## Capabilities

### New Capabilities
- `mech-core`: Implementation of the Front Mission-style part system (Torso, Legs, Arms).
- `weapon-ranges`: Mechanics enforcing explicit ranges (Long, Medium, Melee) and their visual representation.
- `terrain-system`: Map logic for hard terrain that blocks player movement but allows shooting over (e.g. water).
- `td-scaffolding`: Basic tower socket and enemy wave scaffolding (Blight-style structure).

## Impact

- **New:** `src/engine/` (core loop), `src/game/mech.js`, `src/game/map.js`
- **Docs:** `specs/v0_prototype.md` serves as the authoritative definition.
