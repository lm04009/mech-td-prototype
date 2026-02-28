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
}

// Export a singleton instance
export const PlayerProfile = new PlayerProfileManager();
