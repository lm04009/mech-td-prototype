import { GameState } from './GameState.js';
import { EventBus } from '../engine/EventBus.js';
import { EntityManager } from './EntityManager.js';
import { GameMap } from './map.js';
import { HUB } from './maps/hub.js';
import { Mech } from './mech.js';
import { Camera } from './camera.js';
import { Pathfinder } from '../engine/Pathfinder.js';
import { PlayerProfile } from './PlayerProfile.js';

import { MapScene } from './MapScene.js';

export class BaseScene {
    constructor() {
        this.TILE_SIZE = 40;
        this.WORLD_WIDTH_TILES = 50;
        this.WORLD_HEIGHT_TILES = 50;

        this.app = null;
        this.canvas = null;
        this.ctx = null;
        this.dataStore = null;
        this.eventBus = null;
        this.input = null;

        this.map = null;
        this.mech = null;
        this.camera = null;

        // Define interactable regions
        this.interactables = [];
        this.hoveredPrompt = null;
        this.pendingInteractable = null;
    }

    enter(app) {
        this.app = app;
        this.canvas = app.canvas;
        this.ctx = app.ctx;
        this.dataStore = app.dataStore;
        this.eventBus = app.eventBus;
        this.input = app.input;

        this.keydownListener = (e) => this.onKeyDown(e);
        window.addEventListener('keydown', this.keydownListener);

        this.deployListener = (newLoadout) => {
            // Re-instantiate the mech at its current position using the new loadout
            const currentX = this.mech ? this.mech.x : undefined;
            const currentY = this.mech ? this.mech.y : undefined;
            this.mech = new Mech(currentX, currentY, this.eventBus, this.dataStore, newLoadout);
            this.mech.weaponsPowered = false;
            if (this.camera) this.camera.follow(this.mech);
        };
        this.eventBus.on('hangar:deploy', this.deployListener);

        this.setupBase();
    }

    leave() {
        window.removeEventListener('keydown', this.keydownListener);
        if (this.app.eventBus && this.deployListener) {
            this.app.eventBus.off('hangar:deploy', this.deployListener);
        }
        if (this.app.uiManager) {
            this.app.uiManager.hideScreen();
        }
    }

    setupBase() {
        if (this.app.uiManager) {
            this.app.uiManager.hideScreen();
        }

        this.map = new GameMap(HUB.width, HUB.height, HUB.tileSize);
        for (const t of HUB.tiles) this.map.setTile(t.x, t.y, t.type);

        const cx = Math.floor(HUB.width / 2);
        const cy = Math.floor(HUB.height / 2);
        const centerWorldX = cx * HUB.tileSize;
        const centerWorldY = cy * HUB.tileSize;

        this.mech = new Mech(centerWorldX, centerWorldY, this.eventBus, this.dataStore, PlayerProfile.loadout);
        this.mech.weaponsPowered = false;

        this.camera = new Camera(
            HUB.width * HUB.tileSize,
            HUB.height * HUB.tileSize,
            this.canvas.width,
            this.canvas.height
        );
        this.camera.follow(this.mech);

        this.repathThrottleMs = 0;
        this.lmbWasDown = false;
        this.clickRings = [];

        const interactHandlers = {
            hangar: () => this.openHangarUI(),
            map_device: () => this.startMission(),
        };

        for (const def of HUB.interactables) {
            this.interactables.push({
                id: def.id,
                name: def.name,
                worldX: def.gridX * HUB.tileSize,
                worldY: def.gridY * HUB.tileSize,
                radius: def.radius,
                onInteract: interactHandlers[def.id],
            });
        }
    }

    openHangarUI() {
        console.log("Opening Hangar UI...");
        if (this.app.uiManager) {
            this.app.uiManager.showScreen('Hangar');
        }
    }

    startMission() {
        console.log("Starting Mission...");
        // Transition to MapScene
        this.app.switchScene(new MapScene());
    }

    resizeCanvas(width, height) {
        if (this.camera) {
            this.camera.resize(width, height);
        }
    }

    onKeyDown(e) {
        if (e.key === 'Escape') {
            if (this.app.uiManager) {
                if (this.app.uiManager.currentScreen && this.app.uiManager.currentScreen.constructor.name === 'PauseScreen') {
                    this.app.uiManager.hideScreen();
                } else if (!this.app.uiManager.currentScreen) {
                    this.app.uiManager.showScreen('Pause');
                } else if (this.app.uiManager.currentScreen.constructor.name === 'HangarScreen') {
                    // Close hangar on escape
                    this.app.uiManager.hideScreen();
                }
            }
        }
    }

    update(dt) {
        // Stop updating world logic when paused
        if (this.app.uiManager && this.app.uiManager.currentScreen) return;

        const mouseWorld = this.input.getMouseWorld(this.camera);
        const lmbDown = this.input.mouse.isDown;
        const isNewPress = lmbDown && !this.lmbWasDown;

        // Check for interactable hovering
        this.hoveredPrompt = null;
        for (const inter of this.interactables) {
            const dx = mouseWorld.x - inter.worldX;
            const dy = mouseWorld.y - inter.worldY;
            if (Math.hypot(dx, dy) <= inter.radius) {
                this.hoveredPrompt = inter;
                break;
            }
        }

        if (isNewPress && this.hoveredPrompt) {
            const distToMech = Math.hypot(this.mech.x - this.hoveredPrompt.worldX, this.mech.y - this.hoveredPrompt.worldY);
            if (distToMech <= this.hoveredPrompt.radius * 2) {
                this.hoveredPrompt.onInteract();
                this.lmbWasDown = lmbDown;
                this.pendingInteractable = null;
                return;
            } else {
                this._requestRepath({ x: this.hoveredPrompt.worldX, y: this.hoveredPrompt.worldY }, true);
                this.pendingInteractable = this.hoveredPrompt;
            }
        } else if (isNewPress) {
            this._requestRepath(mouseWorld, true);
            this.pendingInteractable = null;
        } else if (lmbDown) {
            this.repathThrottleMs -= dt * 1000;
            if (this.repathThrottleMs <= 0) {
                this._requestRepath(mouseWorld, false);
            }
        }
        this.lmbWasDown = lmbDown;

        // Check if we arrived at pending interactable
        if (this.pendingInteractable) {
            const distToMech = Math.hypot(this.mech.x - this.pendingInteractable.worldX, this.mech.y - this.pendingInteractable.worldY);
            if (distToMech <= this.pendingInteractable.radius * 2) {
                this.pendingInteractable.onInteract();
                this.pendingInteractable = null;
                return;
            }
        }

        // Ensure Mech doesn't fire weapons in base
        const emptyWeaponInput = { rmb: false, num1: false, num2: false, num3: false };
        const mechInputMouse = { ...mouseWorld, isDown: false };

        this.mech.update(dt, mechInputMouse, emptyWeaponInput, this);
        this.camera.follow(this.mech);

        // Update click rings
        const dtMs = dt * 1000;
        for (let i = this.clickRings.length - 1; i >= 0; i--) {
            this.clickRings[i].timerMs -= dtMs;
            if (this.clickRings[i].timerMs <= 0) this.clickRings.splice(i, 1);
        }
    }

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

        if (!isWalkable(endGrid.x, endGrid.y)) {
            endGrid = Pathfinder.snapToNearestWalkable(
                endGrid, isWalkable, this.map.width, this.map.height
            );
        }

        const gridPath = Pathfinder.findPath(
            startGrid, endGrid, isWalkable, this.map.width, this.map.height
        );

        if (gridPath && gridPath.length > 0) {
            const worldPath = gridPath.map(p => ({
                x: p.x * TS + TS / 2,
                y: p.y * TS + TS / 2
            }));

            worldPath[worldPath.length - 1] = { x: mouseWorld.x, y: mouseWorld.y };

            if (worldPath.length > 1) {
                worldPath.shift();
            }

            this.mech.setPath(worldPath);

            if (isNewPress) {
                const dest = worldPath[worldPath.length - 1] || mouseWorld;
                this.clickRings.push({ x: dest.x, y: dest.y, timerMs: 300 });
            }
        }
        this.repathThrottleMs = 100;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(-this.camera.x, -this.camera.y);

        this.map.draw(ctx);

        // Draw interactables
        for (const inter of this.interactables) {
            const x = inter.worldX;
            const y = inter.worldY;

            if (inter.id === 'hangar') {
                // Hangar Console — teal square
                ctx.fillStyle = 'rgba(0, 220, 180, 0.85)';
                ctx.fillRect(x - 32, y - 32, 64, 64);
                ctx.strokeStyle = '#00ffcc';
                ctx.lineWidth = 3;
                ctx.strokeRect(x - 32, y - 32, 64, 64);
                ctx.fillStyle = '#001a15';
                ctx.font = 'bold 26px Courier New';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('H', x, y);
                ctx.fillStyle = '#00ffcc';
                ctx.font = '11px Courier New';
                ctx.fillText('HANGAR', x, y + 46);
            } else if (inter.id === 'map_device') {
                // Map Device — orange diamond
                ctx.fillStyle = 'rgba(255, 160, 0, 0.85)';
                ctx.beginPath();
                ctx.moveTo(x, y - 40);
                ctx.lineTo(x + 40, y);
                ctx.lineTo(x, y + 40);
                ctx.lineTo(x - 40, y);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#ffaa00';
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.fillStyle = '#1a0d00';
                ctx.font = 'bold 26px Courier New';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('M', x, y);
                ctx.fillStyle = '#ffaa00';
                ctx.font = '11px Courier New';
                ctx.fillText('DEPLOY', x, y + 54);
            }

            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        }

        // Draw click rings
        for (const ring of this.clickRings) {
            const t = ring.timerMs / 300;
            const radius = (1 - t) * 20;
            ctx.strokeStyle = `rgba(255, 255, 255, ${t})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        this.mech.draw(ctx);
        ctx.restore();

        // Draw UI overly text directly for now
        ctx.fillStyle = '#fff';
        ctx.font = '14px Courier New';
        ctx.fillText(`Player Base - Credits: ${PlayerProfile.getCredits()}`, 10, 20);

        if (this.hoveredPrompt) {
            ctx.fillStyle = '#ff0';
            ctx.font = 'bold 20px Courier New';
            const msg = `Click on ${this.hoveredPrompt.name} to interact`;
            ctx.fillText(msg, this.canvas.width / 2 - ctx.measureText(msg).width / 2, this.canvas.height - 50);
        }
    }
}
