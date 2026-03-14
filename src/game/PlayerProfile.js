import { CONFIG } from './Config.js';

class PlayerProfileManager {
    constructor() {
        // Deep copy the starting loadout to avoid mutating the config
        this.loadout = JSON.parse(JSON.stringify(CONFIG.STARTING_LOADOUT));

        this.credits = 0;

        // This will eventually hold unlocked parts and weapons
        this.inventory = {
            parts: [],
            weapons: []
        };
    }

    addCredits(amount) {
        this.credits += amount;
    }

    setCredits(amount) {
        this.credits = amount;
    }

    getCredits() {
        return this.credits;
    }

    /**
     * Development utility to populate the complete stash
     * minus the items that are already equipped.
     * @param {object} dataStore 
     */
    debugInitAllItems(dataStore) {
        this.inventory.parts = [];
        this.inventory.weapons = [];

        // All parts.json parts
        for (const type of ['Body', 'Arm', 'Legs']) {
            const arr = dataStore.parts[type] || [];
            for (const p of arr) {
                // Give 1 of everything in stash
                this.inventory.parts.push(p.ID);
            }
        }

        // Subtract equipped parts so we don't end up with duplicate
        const l = this.loadout;
        const removePart = (id) => {
            if (!id) return;
            const idx = this.inventory.parts.indexOf(id);
            if (idx > -1) this.inventory.parts.splice(idx, 1);
        };
        removePart(l.body?.id);
        removePart(l.legs?.id);
        removePart(l.armLeft?.id);
        removePart(l.armRight?.id);


        // All weapons.json weapons
        for (const type of ['Grip', 'Shoulder']) {
            const arr = dataStore.weapons[type] || [];
            for (const w of arr) {
                this.inventory.weapons.push(w.ID);
            }
        }

        // Subtract equipped weapons
        const removeWpn = (id) => {
            if (!id) return;
            const idx = this.inventory.weapons.indexOf(id);
            if (idx > -1) this.inventory.weapons.splice(idx, 1);
        };

        if (l.slots) {
            for (const arm of ['armLeft', 'armRight']) {
                removeWpn(l.slots[arm]?.grip);
                removeWpn(l.slots[arm]?.shoulder);
            }
        }
    }
}

// Export a singleton instance
export const PlayerProfile = new PlayerProfileManager();
