# Proposal: DOM-Based UI Framework

**Goal**: Replace the rigid Canvas-based UI with a flexible, event-driven DOM UI to support complex future features (Inventory, Mech Lab).

## Problem
The current UI is drawn directly to the canvas every frame.
- **Hard to Layout**: Positioning text/shapes requires manual coordinate math.
- **Hard to Interact**: Creating buttons/inputs requires custom raycasting and state management.
- **Hard to Style**: No CSS support; limited to Canvas API styling.

## Solution
Implement a **"UI Sandwich"** architecture:
1.  **Game Canvas**: Renders the game world (30-60 FPS).
2.  **DOM Overlay**: Renders the UI (HTML/CSS) on top of the canvas.
3.  **Event System**: The Game Logic emits events (`hp-changed`, `credits-earned`) that the UI listens to.

## Architecture

### 1. `UIManager`
- The central controller that manages which "Screen" is currently active.
- Mounts/Unmounts HTML components into the `#ui-layer` div.

### 2. Event-Driven Updates
Instead of the UI polling `mech.hp` every frame (60 times/sec), it waits for a signal.

**Old (Canvas Polling):**
```javascript
// Game.js draw() loop
ctx.fillText("HP: " + mech.hp, 10, 10);
```

**New (Event Driven):**
```javascript
// Mech.js
this.hp -= damage;
eventBus.emit('mech-health-changed', this.hp);

// HUD.js
eventBus.on('mech-health-changed', (hp) => {
  this.healthBar.style.width = hp + '%';
});
```

## Benefits
- **Future Proof**: Ready for Inventory grids, skill trees, and drag-and-drop.
- **Performance**: UI only updates when data *actually* changes.
- **Aesthetics**: Full power of CSS3 (animations, transparency, gradients).
