import { GameState } from './GameState.js';
import { EventBus } from '../engine/EventBus.js';
import { EntityManager } from './EntityManager.js';
import { EncounterManager } from './EncounterManager.js';
import { CONFIG, LEVEL_1_ENCOUNTER } from './Config.js';
import { GameMap } from './map.js';
import { Mech } from './mech.js';
import { Terminal } from './terminal.js';
import { Camera } from './camera.js';
import { Tower } from './tower.js';
import { Pathfinder } from '../engine/Pathfinder.js';
import { PlayerProfile } from './PlayerProfile.js';

// We import BaseScene to be able to transition back
import { BaseScene } from './BaseScene.js';

export class MapScene {
    constructor() {
        // Constants
        this.TILE_SIZE = 40;
        this.WORLD_WIDTH_TILES = 50;
        this.WORLD_HEIGHT_TILES = 50;

        // Engine Systems
        this.app = null;
        this.canvas = null;
        this.ctx = null;
        this.dataStore = null;
        this.eventBus = null;
        this.input = null;

        // Game State
        this.gameState = GameState.PLAYING; // 'PLAYING', 'GAME_OVER', 'GAME_WIN'
        this.credits = 500;

        // Entities & Systems (Initialized in reset)
        this.map = null;
        this.mech = null;
        this.terminal = null;
        this.camera = null;
        this.entities = null;
        this.encounter = null;
    }

    enter(app) {
        this.app = app;
        this.canvas = app.canvas;
        this.ctx = app.ctx;
        this.dataStore = app.dataStore;
        this.eventBus = app.eventBus;
        this.input = app.input;

        // Bindings
        this.keydownListener = (e) => this.onKeyDown(e);
        window.addEventListener('keydown', this.keydownListener);

        this.reset();
    }

    leave() {
        window.removeEventListener('keydown', this.keydownListener);
        if (this.app.uiManager) {
            this.app.uiManager.hideScreen();
        }
    }

    reset() {
        console.log('Resetting Game...');
        this.gameState = GameState.PLAYING;
        this.credits = 500;

        // Reset UI
        if (this.app && this.app.uiManager) {
            this.app.uiManager.hideScreen();
            this.eventBus.emit('game:reset');
            // Force HUD update for initial state
            this.eventBus.emit('credits:change', this.credits);
        }

        // 1. Map & Core Entities
        this.map = new GameMap(this.WORLD_WIDTH_TILES, this.WORLD_HEIGHT_TILES, this.TILE_SIZE);

        const cx = (this.map.width * this.TILE_SIZE) / 2;
        const cy = (this.map.height * this.TILE_SIZE) / 2;

        this.mech = new Mech(cx - 100, cy, this.eventBus, this.dataStore, PlayerProfile.loadout);
        this.terminal = new Terminal(cx, cy, this.eventBus);

        // Emit initial health states for UI sync
        this.eventBus.emit('mech:damage', { hp: this.mech.parts.body.hp, maxHp: this.mech.parts.body.maxHp, parts: this.mech.parts });
        this.eventBus.emit('terminal:damage', { hp: this.terminal.hp, maxHp: this.terminal.maxHp });

        // 2. Managers
        this.entities = new EntityManager();
        this.encounter = new EncounterManager(this, this.dataStore);
        this.encounter.loadEncounter(LEVEL_1_ENCOUNTER);

        // 3. Camera
        this.camera = new Camera(
            this.map.width * this.TILE_SIZE,
            this.map.height * this.TILE_SIZE,
            this.canvas.width,
            this.canvas.height
        );
        this.camera.follow(this.mech);

        // Click-to-move state
        this.repathThrottleMs = 0;
        this.lmbWasDown = false;    // Edge-detection for new LMB press
        this.clickRings = [];       // [{x, y, timerMs}] — world-space ring animations

    }

    resizeCanvas(width, height) {
        if (this.camera) {
            this.camera.resize(width, height);
        }
    }

    onKeyDown(e) {
        if (e.key === 'Escape') {
            if (this.gameState === GameState.PLAYING) {
                this.gameState = GameState.PAUSED;
                if (this.app.uiManager) this.app.uiManager.showScreen('Pause');
            } else if (this.gameState === GameState.PAUSED) {
                this.gameState = GameState.PLAYING;
                if (this.app.uiManager) this.app.uiManager.hideScreen();
            }
        }
        if ((this.gameState === GameState.GAME_OVER || this.gameState === GameState.GAME_WIN) && e.key.toLowerCase() === 'r') {
            // Return to base scene or restart based on what Player decided.
            // For now, let's let them return to base.
            this.app.switchScene(new BaseScene());
        }
        if (this.gameState === GameState.PLAYING && e.key === 'k') { // Debug Kill, only when playing
            this.terminal.takeDamage(100);
        }
    }

    update(dt) {
        if (this.gameState === GameState.GAME_OVER || this.gameState === GameState.GAME_WIN || this.gameState === GameState.PAUSED) return;

        // 1. Check Loss
        // 1. Check Loss
        if (this.terminal.hp <= 0) {
            this.gameState = GameState.GAME_OVER;
            this.gameOverReason = 'TERMINAL_DESTROYED';
            this.eventBus.emit('game:over', { reason: this.gameOverReason });
            return;
        }
        if (this.mech.parts.body.hp <= 0) {
            this.gameState = GameState.GAME_OVER;
            this.gameOverReason = 'MECH_DESTROYED';
            this.eventBus.emit('game:over', { reason: this.gameOverReason });
            return;
        }

        // 2. Input & Context
        const mouseWorld = this.input.getMouseWorld(this.camera);
        const grid = this.input.getMouseGrid(this.camera, this.TILE_SIZE);
        const hoveringSocket = this.map.isBuildable(grid.col, grid.row);
        const lmbDown = this.input.mouse.isDown;

        // 3. Construction Logic
        if (lmbDown && !this.clickProcessed) {
            this.clickProcessed = true;
            if (hoveringSocket) {
                this.tryBuildTower(grid.col, grid.row);
            }
        }
        if (!lmbDown) this.clickProcessed = false;

        // 4. Click-to-move pathfinding
        if (!hoveringSocket) {
            const isNewPress = lmbDown && !this.lmbWasDown; // Leading edge

            if (isNewPress) {
                // Immediate re-path on new click
                this._requestRepath(mouseWorld, true);
            } else if (lmbDown) {
                // Throttled re-path while held
                this.repathThrottleMs -= dt * 1000;
                if (this.repathThrottleMs <= 0) {
                    this._requestRepath(mouseWorld, false);
                }
            }
        }
        this.lmbWasDown = lmbDown;

        // 5. Mech Update (Weapon Fire)
        const mechInputMouse = { ...mouseWorld };
        if (hoveringSocket) mechInputMouse.isDown = false;

        const weaponInput = this.input.getWeaponInputState();

        const newProjectiles = this.mech.update(dt, mechInputMouse, weaponInput, this);
        if (newProjectiles && newProjectiles.length > 0) {
            for (const p of newProjectiles) this.entities.addProjectile(p);
        }

        // 6. System Updates
        this.camera.follow(this.mech);
        this.map.update(dt, this.mech);
        this.encounter.update(dt);
        this.entities.update(dt, this);

        // 7. Click ring timers
        const dtMs = dt * 1000;
        for (let i = this.clickRings.length - 1; i >= 0; i--) {
            this.clickRings[i].timerMs -= dtMs;
            if (this.clickRings[i].timerMs <= 0) this.clickRings.splice(i, 1);
        }

    }

    /**
     * Compute an A* path from the mech to the given world position and
     * call mech.setPath() with the resulting world-space waypoints.
     * Falls back to nearest walkable tile if the target is not reachable.
     * Resets the re-path throttle to 100ms.
     */
    _requestRepath(mouseWorld, isNewPress) {
        const TS = this.TILE_SIZE;
        const legsData = this.mech.parts.legs;
        const isWalkable = (gx, gy) => this.map.isWalkableFor(gx, gy, legsData);

        const startGrid = {
            x: Math.floor(this.mech.x / TS),
            y: Math.floor(this.mech.y / TS)
        };
        let endGrid = {
            x: Math.floor(mouseWorld.x / TS),
            y: Math.floor(mouseWorld.y / TS)
        };

        let isSnapped = false;
        // Snap to nearest walkable if target tile is blocked
        if (!isWalkable(endGrid.x, endGrid.y)) {
            endGrid = Pathfinder.snapToNearestWalkable(
                endGrid, isWalkable, this.map.width, this.map.height
            );
            isSnapped = true;
        }

        const gridPath = Pathfinder.findPath(
            startGrid, endGrid, isWalkable, this.map.width, this.map.height
        );

        if (gridPath && gridPath.length > 0) {
            // Convert grid coords to world-space tile centers
            const worldPath = gridPath.map(p => ({
                x: p.x * TS + TS / 2,
                y: p.y * TS + TS / 2
            }));

            // The exact pixel destination feels better than snapping to tile centers, 
            // especially for the final node. If we didn't snap due to blocked terrain, 
            // use the exact mouse click for the end.
            if (!isSnapped) {
                worldPath[worldPath.length - 1] = { x: mouseWorld.x, y: mouseWorld.y };
            }

            // The first node is the tile we are already in. 
            // If we don't shift it, the mech tries to walk back to the center of its current tile.
            if (worldPath.length > 1) {
                worldPath.shift();
            }

            this.mech.setPath(worldPath);

            // Click ring visual at intended destination (only spawn on initial click, not on drag-repaths)
            if (isNewPress) {
                const dest = worldPath[worldPath.length - 1] || mouseWorld;
                this.clickRings.push({ x: dest.x, y: dest.y, timerMs: 300 });
            }
        }

        this.repathThrottleMs = 100; // Reset throttle
    }

    /**
     * Draw in-flight click ring animations in world space.
     * Each ring expands from 0 to 20px radius and fades out over 300ms.
     * Drawn above map/entities, below mech.
     */
    _drawClickRings(ctx) {
        for (const ring of this.clickRings) {
            const t = ring.timerMs / 300; // 1.0 → 0.0 as it fades
            const radius = (1 - t) * 20;
            const alpha = t;
            ctx.save();
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    draw() {
        const ctx = this.ctx;

        // Clear
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // World Space
        ctx.save();
        ctx.translate(-this.camera.x, -this.camera.y);

        this.map.draw(ctx);
        this.drawEncounterOverlay(ctx);

        this.terminal.draw(ctx);
        this.entities.draw(ctx);

        // Click rings (above map, below mech)
        this._drawClickRings(ctx);

        // Ghost Preview
        this.drawGhost(ctx);

        this.mech.draw(ctx);

        ctx.restore();

        // UI Layer - Handled by DOM
        // this.drawUI(ctx);
    }

    // Logic Helpers
    addCredits(amount) {
        this.credits += amount;
        this.eventBus.emit('credits:change', this.credits);
    }

    tryBuildTower(col, row) {
        const COST = 100;
        if (this.credits < COST) return false;

        // Check 1: Map Validity (Socket, Empty)
        if (!this.map.isBuildable(col, row)) return false;

        // Check 2: Entity Validity (Not on top of Player)
        const tileRect = {
            x: col * this.TILE_SIZE,
            y: row * this.TILE_SIZE,
            width: this.TILE_SIZE,
            height: this.TILE_SIZE
        };
        const playerCircle = {
            x: this.mech.x,
            y: this.mech.y,
            radius: this.mech.size / 2
        };

        // Use Collision helper if imported, or just simple check?
        // Game.js doesn't import Collision yet. 
        // Let's add import or just simple AABB/Circle check here since it's one-off?
        // Better to import Collision for consistency.

        // Assuming we add import. 
        // But if I don't add import in this step, it breaks.
        // Let's do simple check here to save an import if it's the only usage?
        // No, use Collision.js. I will add import in a separate step or same step if possible.
        // replace_file_content can't do non-contiguous.
        // I will use Collision.checkCircleRect fully qualified if imported.
        // Need to add import first? 
        // Let's just implement the logic assuming Collision is imported, then add import.

        // Actually, let's just do a quick dist check. 
        // Box center
        const cx = tileRect.x + this.TILE_SIZE / 2;
        const cy = tileRect.y + this.TILE_SIZE / 2;
        const dx = Math.abs(this.mech.x - cx);
        const dy = Math.abs(this.mech.y - cy);

        // If dist < (TileHalf + PlayerRadius), overlap.
        const combined = (this.TILE_SIZE / 2) + (this.mech.size / 2);
        // Make it strict. If any overlap, deny.
        if (dx < combined * 0.8 && dy < combined * 0.8) { // 0.8 scale to be forgiving at edges?
            // Actually, strict is better.
            console.warn("Cannot build: Player is in the way.");
            return false;
        }

        const t = new Tower(col, row, this.TILE_SIZE);
        if (this.map.addTower(t)) {
            this.entities.addTower(t);
            this.credits -= COST;
            this.eventBus.emit('credits:change', this.credits);
            return true;
        }
        return false;
    }

    // Visual Helpers
    drawEncounterOverlay(ctx) {
        if (!this.encounter || !this.map) return;

        ctx.save();
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        // 1. Telegraphs (Faded)
        this.encounter.telegraphLanes.forEach(laneId => {
            const path = this.map.getLanePath(laneId);
            if (path.length > 1) {
                // Pulse Effect
                const alpha = 0.2 + Math.sin(Date.now() / 200) * 0.1;
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.setLineDash([15, 10]);
                ctx.beginPath();
                ctx.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
                ctx.stroke();

                // Draw Portal Indicator (Inactive)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.beginPath();
                ctx.arc(path[0].x, path[0].y, 25, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        // 2. Active Lanes (Solid)
        ctx.setLineDash([]);
        this.encounter.activeLanes.forEach(laneId => {
            const path = this.map.getLanePath(laneId);
            if (path.length > 1) {
                // Check if this lane is currently spawning (Active Portal)
                const isSpawning = this.encounter.activePortals.some(p => p.lane === laneId);

                if (isSpawning) {
                    // Intense Glow & Pulse
                    const pulse = 1.0 + Math.sin(Date.now() / 150) * 0.1;

                    ctx.strokeStyle = '#ff4444';
                    ctx.lineWidth = 3;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = 'red';

                    ctx.beginPath();
                    ctx.moveTo(path[0].x, path[0].y);
                    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
                    ctx.stroke();

                    // Draw Portal (Active Spawning) - Big and Animated
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#ff0000';
                    ctx.fillStyle = '#aa0000'; // Dark Red Center
                    ctx.beginPath();
                    ctx.arc(path[0].x, path[0].y, 20 * pulse, 0, Math.PI * 2);
                    ctx.fill();

                    // Rim
                    ctx.strokeStyle = '#ff8888';
                    ctx.lineWidth = 4;
                    ctx.stroke();
                } else {
                    // Established Path (Finished Spawning) - Static, Darker Red
                    ctx.strokeStyle = '#880000'; // Dark Red
                    ctx.lineWidth = 3;
                    ctx.shadowBlur = 0; // No glow

                    ctx.beginPath();
                    ctx.moveTo(path[0].x, path[0].y);
                    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
                    ctx.stroke();

                    // Draw Portal (Inactive/Dormant) - Small, Dark
                    ctx.fillStyle = '#440000';
                    ctx.beginPath();
                    ctx.arc(path[0].x, path[0].y, 15, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#660000';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        });

        ctx.restore();
    }

    drawGhost(ctx) {
        const grid = this.input.getMouseGrid(this.camera, this.TILE_SIZE);
        if (this.map && this.map.isBuildable(grid.col, grid.row)) {
            const x = grid.col * this.TILE_SIZE;
            const y = grid.row * this.TILE_SIZE;
            const canAfford = this.credits >= 100;

            ctx.save();
            ctx.fillStyle = canAfford ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);

            ctx.strokeStyle = canAfford ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(x + this.TILE_SIZE / 2, y + this.TILE_SIZE / 2, 250, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    drawUI(ctx) {
        if (this.gameState === GameState.GAME_OVER) {
            this.drawGameOver(ctx);
            return;
        }
        if (this.gameState === GameState.GAME_WIN) {
            this.drawWinScreen(ctx);
            return;
        }

        ctx.fillStyle = '#fff';
        ctx.font = '12px Courier New';
        ctx.fillText(`Wasd to Move, Click to Fire`, 10, 20);
        ctx.fillText(`Hover Socket -> Click to Build (Cost: 100)`, 10, 35);
        // ctx.fillText(`Mech: ${Math.round(this.mech.x)}, ${Math.round(this.mech.y)}`, 10, 50); // Debug coords

        // Mech HP
        ctx.fillStyle = this.mech.parts.body.hp > 10 ? '#0f0' : '#f00';
        ctx.fillText(`MECH HP: ${Math.ceil(this.mech.parts.body.hp)}/${this.mech.parts.body.maxHp}`, 10, 50);

        ctx.fillStyle = '#fff';
        ctx.fillText(`Enemies: ${this.entities.enemies.length}`, 10, 65);
        ctx.fillText(`Terminal HP: ${this.terminal.hp}/${this.terminal.maxHp}`, 10, 80);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 20px Courier New';
        ctx.fillText(`CREDITS: ${this.credits}`, 10, 110);
    }

    drawGameOver(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#f00';
        ctx.font = '48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);

        ctx.fillStyle = '#fff';
        ctx.font = '24px Courier New';

        let message = 'Mission Failed';
        if (this.gameOverReason === 'TERMINAL_DESTROYED') {
            message = 'Terminal Destroyed';
        } else if (this.gameOverReason === 'MECH_DESTROYED') {
            message = 'Mech Critical Failure';
        }

        ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2 + 50);
        ctx.fillText('Press R to Restart', this.canvas.width / 2, this.canvas.height / 2 + 80);
        ctx.textAlign = 'start';
    }

    triggerWin() {
        if (this.gameState !== GameState.PLAYING) return;
        this.gameState = GameState.GAME_WIN;
        console.log('VICTORY!');
        PlayerProfile.addCredits(this.credits); // Award remaining credits to global profile
        this.eventBus.emit('game:win');
    }

    drawWinScreen(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#0f0';
        ctx.font = '48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION COMPLETE', this.canvas.width / 2, this.canvas.height / 2);

        ctx.fillStyle = '#fff';
        ctx.font = '24px Courier New';
        // ctx.fillText(`Credits Earned: ${this.credits}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
        ctx.fillText('Press R to Restart', this.canvas.width / 2, this.canvas.height / 2 + 80);
        ctx.textAlign = 'start';
    }
}
