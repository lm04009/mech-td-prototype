import { Enemy } from './enemy.js';
import { CONFIG } from './Config.js'; // You might need to adjust import path

export class EncounterManager {
    constructor(game) {
        this.game = game;
        this.events = []; // Queue
        this.activePortals = []; // Currently spawning
        this.activeLanes = new Set(); // For rendering (Solid)
        this.telegraphLanes = new Set(); // For rendering (Faded)

        this.encounterTime = 0;
        this.gameActive = false;
    }

    loadEncounter(encounterData) {
        // Deep copy to avoid mutation issues if we restart
        this.events = JSON.parse(JSON.stringify(encounterData));

        // Sort by startTime just in case
        this.events.sort((a, b) => a.startTime - b.startTime);

        this.activePortals = [];
        this.activeLanes.clear();
        this.telegraphLanes.clear();
        this.encounterTime = 0;
        this.gameActive = true;
        console.log(`Encounter Loaded. ${this.events.length} events.`);
    }

    update(dt) {
        if (!this.gameActive) return;

        this.encounterTime += dt;

        // 1. Check for Telegraphs (Future Events)
        // Look ahead in the event queue
        for (const event of this.events) {
            if (event.startTime - CONFIG.TELEGRAPH_DURATION <= this.encounterTime &&
                event.startTime > this.encounterTime) {

                // If this is a NEW telegraph, enable sockets
                if (!this.telegraphLanes.has(event.lane) && !this.activeLanes.has(event.lane)) {
                    console.log(`Encounter: Telegraph started for ${event.lane}`);
                    this.game.map.unlockLaneSockets(event.lane);
                }

                this.telegraphLanes.add(event.lane);
            }
        }

        // 2. Check for Activations (Current Events)
        // We process the queue.
        while (this.events.length > 0 && this.events[0].startTime <= this.encounterTime) {
            const event = this.events.shift();
            this.activatePortal(event);
        }

        // 3. Update Active Portals
        for (let i = this.activePortals.length - 1; i >= 0; i--) {
            const portal = this.activePortals[i];

            portal.timer += dt;
            if (portal.timer >= portal.interval) {
                portal.timer = 0;
                this.spawnEnemy(portal);
                portal.remaining--;
            }

            if (portal.remaining <= 0) {
                // Portal Finished
                this.activePortals.splice(i, 1);
                // Note: We don't remove from activeLanes immediately?
                // For now, let's keep it simple: Path stays active forever (User Request).
                // So we do nothing to activeLanes.
                console.log(`Portal ${portal.lane} finished spawning.`);
            }
        }

        // 4. Check for Win Condition
        if (this.events.length === 0 && this.activePortals.length === 0 && this.game.entities.enemies.length === 0) {
            this.game.triggerWin();
        }
    }

    activatePortal(event) {
        console.log(`Activating Portal: ${event.lane}`);
        this.game.map.unlockLaneSockets(event.lane);
        this.telegraphLanes.delete(event.lane); // No longer just a telegraph
        this.activeLanes.add(event.lane);       // Now Active

        this.activePortals.push({
            lane: event.lane,
            remaining: event.count,
            timer: 0, // Spawn immediately? Or wait for first interval? Let's spawn immediately at 0.
            interval: event.interval,
            enemyType: event.enemyType
        });

        // Instant spawn first one?
        // Let's let the update loop handle it naturally (timer starts at 0, if we set timer=interval it spawns instantly)
        this.activePortals[this.activePortals.length - 1].timer = event.interval;
    }

    spawnEnemy(portal) {
        const path = this.game.map.getLanePath(portal.lane);
        if (!path || path.length === 0) {
            console.error(`Invalid Path for lane ${portal.lane}`);
            return;
        }

        // Clone path for Enemy (since they might modify their tracking index)
        // Actually Enemy constructor just takes the path array.
        // We need to ensure Enemy copies it or just reads it.
        // Looking at Enemy.js (from context), it likely takes the path.
        // We verified Map definitions are [Start, End].
        // Enemy needs to walk Start -> End.

        const enemy = new Enemy(path);
        this.game.entities.addEnemy(enemy);
    }
}
