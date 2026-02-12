# Design: Camera System

## Context

We need to decouple the Game World (Map) from the Viewport (Window/Camera).

## Goals

- **Independence**: Changing window size should not change map size.
- **Centering**: The player should always be the focus.
- **Simplicity**: Maintain the prototype's lightweight structure.

## Decisions

### Decision 1: Fixed Map Size
We will set the map to a fixed 50x50 tiles (2000x2000 pixels). This is large enough to be interesting but small enough to manage easily.

### Decision 2: Camera Class
We will introduce a `Camera` class in `src/game/camera.js`:

```javascript
class Camera {
    constructor(mapWidth, mapHeight, viewportWidth, viewportHeight) {
        this.x = 0;
        this.y = 0;
        // ... bounds ...
    }
    
    update(targetX, targetY) {
        // Center on target
        this.x = targetX - this.viewportWidth / 2;
        this.y = targetY - this.viewportHeight / 2;
        
        // Clamp to map bounds
        // ...
    }
}
```

### Decision 3: Rendering Pipeline
Instead of moving every object, we will use Canvas `translate`:

```javascript
ctx.save();
ctx.translate(-camera.x, -camera.y);
// Draw everything (World Space)
ctx.restore();
// Draw UI (Screen Space)
```

### Decision 4: Input Transformation
Input events (mouse clicks) give Screen Coordinates. We must convert them to World Coordinates before using them for game logic (aiming, pathfinding).

`worldX = screenX + camera.x`
`worldY = screenY + camera.y`

## Tradeoffs

- **Performance**: `ctx.save()/restore()` and `translate()` are very fast, so performance impact is negligible.
- **Complexity**: Requires touching `input.js`, `main.js`, and `mech.js` to ensure all coordinate references are corrected.
