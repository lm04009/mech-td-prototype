import { CONFIG } from '../game/Config.js';
import { CombatSystem } from '../engine/CombatSystem.js';

export const MechStats = {
    /**
     * Parse the given parts and weapons loadout using the dataStore to derive total
     * stats for the Mech (Weight, PowerOutput, Evasion, etc).
     * 
     * @param {object} loadout - The hierarchical loadout object (like CONFIG.STARTING_LOADOUT)
     * @param {object} dataStore - DataStore singleton to look up part data
     * @returns {object} Derived stats
     */
    deriveStats(loadout, dataStore) {
        if (!loadout || !dataStore) return null;

        const bodyData = dataStore.getPartById('Body', loadout.body?.id) || {};
        const armLData = dataStore.getPartById('Arm', loadout.armLeft?.id) || {};
        const armRData = dataStore.getPartById('Arm', loadout.armRight?.id) || {};
        const legsData = dataStore.getPartById('Legs', loadout.legs?.id) || {};

        let allWeaponWeights = 0;
        const slotsObj = loadout.slots || {};
        
        for (const arm of ['armLeft', 'armRight']) {
            for (const type of ['grip', 'shoulder']) {
                const weaponId = slotsObj[arm]?.[type];
                if (weaponId) {
                    const wData = dataStore.getWeaponById(weaponId);
                    if (wData) {
                        allWeaponWeights += (wData.Weight || 0);
                    }
                }
            }
        }

        const totalWeight = (bodyData.Weight || 0) + (armLData.Weight || 0) + (armRData.Weight || 0) + (legsData.Weight || 0) + allWeaponWeights;
        const totalPowerOutput = (bodyData.PowerOutput || 0) + (legsData.PowerOutput || 0);

        const moveEfficiency = CombatSystem.calcMoveEfficiency(totalWeight, totalPowerOutput);
        const additiveMods = (legsData.MovementSpeedMod || 0);
        const actualSpeed = CombatSystem.calcActualSpeed(CONFIG.MECH_BASE_SPEED, additiveMods, moveEfficiency);
        
        const evasion = CombatSystem.calcEvasion(totalWeight, totalPowerOutput);

        // Max HP sum across all parts
        const maxHp = (bodyData.HP || 0) + (armLData.HP || 0) + (armRData.HP || 0) + (legsData.HP || 0);

        return {
            totalWeight,
            totalPowerOutput,
            moveEfficiency, // Out of 10000
            actualSpeed,
            evasion, // Out of 10000
            maxHp,
            bodyData,
            armLData,
            armRData,
            legsData
        };
    },

    /**
     * Safely calculate % values for UI representation
     */
    toPercent(valueBase10000) {
        return Math.floor((valueBase10000 / 10000) * 100);
    }
};
