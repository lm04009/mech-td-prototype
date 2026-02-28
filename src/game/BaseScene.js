import { GameState } from './GameState.js';
import { EventBus } from '../engine/EventBus.js';
import { EntityManager } from './EntityManager.js';
import { GameMap, TERRAIN } from './map.js';
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

        this.setupBase();
    }

    leave() {
        window.removeEventListener('keydown', this.keydownListener);
        if (this.app.uiManager) {
            this.app.uiManager.hideScreen();
        }
    }

    setupBase() {
        if (this.app.uiManager) {
            this.app.uiManager.hideScreen();
        }

        this.map = new GameMap(this.WORLD_WIDTH_TILES, this.WORLD_HEIGHT_TILES, this.TILE_SIZE);
        const cx = Math.floor(this.map.width / 2);
        const cy = Math.floor(this.map.height / 2);

        // Build a closed 20x20 room
        const roomSize = 10;
        for (let x = 0; x < this.map.width; x++) {
            for (let y = 0; y < this.map.height; y++) {
                if (x < cx - roomSize || x > cx + roomSize || y < cy - roomSize || y > cy + roomSize) {
                    this.map.setTile(x, y, TERRAIN.WALL);
                } else if (x === cx - roomSize || x === cx + roomSize || y === cy - roomSize || y === cy + roomSize) {
                    this.map.setTile(x, y, TERRAIN.WALL);
                } else {
                    this.map.setTile(x, y, TERRAIN.GROUND);
                }
            }
        }

        const centerWorldX = cx * this.TILE_SIZE;
        const centerWorldY = cy * this.TILE_SIZE;

        this.mech = new Mech(centerWorldX, centerWorldY, this.eventBus, this.dataStore, PlayerProfile.loadout);
        this.mech.weaponsPowered = false;

        this.camera = new Camera(
            this.map.width * this.TILE_SIZE,
            this.map.height * this.TILE_SIZE,
            this.canvas.width,
            this.canvas.height
        );
        this.camera.follow(this.mech);

        this.repathThrottleMs = 0;
        this.lmbWasDown = false;
        this.clickRings = [];

        // Hangar console interactable
        this.interactables.push({
            id: 'hangar',
            name: 'Hangar Console',
            worldX: (cx - 8) * this.TILE_SIZE,
            worldY: (cy - 8) * this.TILE_SIZE,
            radius: 80,
            onInteract: () => this.openHangarUI()
        });

        // Map Device interactable
        this.interactables.push({
            id: 'map_device',
            name: 'Map Device',
            worldX: (cx + 8) * this.TILE_SIZE,
            worldY: (cy - 8) * this.TILE_SIZE,
            radius: 80,
            onInteract: () => this.startMission()
        });
    }

    openHangarUI() {
        console.log("Opening Hangar UI...");
        // Placeholder: Will emit an event for UIManager later
        // this.eventBus.emit('ui:open_hangar');
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
                } else {
                    this.app.uiManager.showScreen('Pause');
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

        // Draw interactables (placeholder visually)
        for (const inter of this.interactables) {
            ctx.fillStyle = 'rgba(0, 200, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(inter.worldX, inter.worldY, 20, 0, Math.PI * 2);
            ctx.fill();
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
