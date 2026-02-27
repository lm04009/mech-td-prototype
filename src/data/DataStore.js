/**
 * DataStore — loads and caches all game data JSON files at startup.
 * Call DataStore.load() once before creating any game entities.
 */

export const DataStore = {
    weapons: null,  // { Grip: [...], Shoulder: [...] }
    parts: null,    // { Body: [...], Arm: [...], Legs: [...] }
    enemies: null,  // [...]

    async load() {
        const [weapons, parts, enemies] = await Promise.all([
            fetch('./src/data/weapons.json').then(r => r.json()),
            fetch('./src/data/parts.json').then(r => r.json()),
            fetch('./src/data/enemies.json').then(r => r.json()),
        ]);
        this.weapons = weapons;
        this.parts = parts;
        this.enemies = enemies;
        console.log('[DataStore] Loaded weapons, parts, enemies.');
    },

    /**
     * Find a weapon entry by ID across all slot categories.
     * @param {number} id
     * @returns {object|null}
     */
    getWeaponById(id) {
        if (!this.weapons) return null;
        for (const category of Object.values(this.weapons)) {
            const found = category.find(w => w.ID === id);
            if (found) return found;
        }
        return null;
    },

    /**
     * Find a part entry by type and ID.
     * @param {'Body'|'Arm'|'Legs'} type
     * @param {number} id
     * @returns {object|null}
     */
    getPartById(type, id) {
        if (!this.parts || !this.parts[type]) return null;
        return this.parts[type].find(p => p.ID === id) || null;
    },

    /**
     * Find an enemy entry by Name.
     * @param {string} name
     * @returns {object|null}
     */
    getEnemyByName(name) {
        if (!this.enemies) return null;
        return this.enemies.find(e => e.Name === name) || null;
    }
};
