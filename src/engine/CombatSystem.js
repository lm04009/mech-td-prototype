/**
 * CombatSystem — Unified, stateless combat formula resolver.
 * All entities (Mech, Enemy, Tower) delegate to these functions.
 * No state is stored here. All values are computed from inputs.
 *
 * Fixed-point note: stats like AccuracyRatio, LocalAttackSpeedMod, etc.
 * use a 10000-base scale where 10000 = 1.0 (100%).
 */

export const CombatSystem = {

    /**
     * Calculate the chance for an attack to hit.
     * @param {number} attackerAccuracyRatio - Attacker's combined accuracy (0–10000+)
     * @param {number} defenderEvasion - Defender's evasion value (0–10000)
     * @returns {number} Probability in [0.05, 1.0]
     */
    calcChanceToHit(attackerAccuracyRatio, defenderEvasion) {
        return Math.max(attackerAccuracyRatio / (10000 + defenderEvasion), 0.05);
    },

    /**
     * Calculate the Mech's evasion from its weight/power ratio.
     * @param {number} totalWeight
     * @param {number} totalPowerOutput
     * @returns {number} Evasion in [0, 10000]
     */
    calcEvasion(totalWeight, totalPowerOutput) {
        if (totalPowerOutput <= 0) return 0;
        const ratio = totalWeight * 10000 / totalPowerOutput;
        return Math.max(0, Math.min(10000, 10000 - Math.floor(Math.max(0, ratio - 3000) * 10 / 7)));
    },

    /**
     * Calculate the Mech's move efficiency from its weight/power ratio.
     * @param {number} totalWeight
     * @param {number} totalPowerOutput
     * @returns {number} MoveEfficiency in [5000, 10000]
     */
    calcMoveEfficiency(totalWeight, totalPowerOutput) {
        if (totalPowerOutput <= 0) return 5000;
        const ratio = totalWeight * 10000 / totalPowerOutput;
        return Math.max(5000, 10000 - Math.floor(Math.max(0, ratio - 7000) * 5 / 3));
    },

    /**
     * Calculate final movement speed.
     * @param {number} entityBaseSpeed - Base speed in pixels/sec
     * @param {number} additiveMods - Sum of additive modifiers (10000-scale, e.g. MovementSpeedMod)
     * @param {number} moveEfficiency - From calcMoveEfficiency (10000-scale)
     * @param {number[]} statusMultipliers - Array of status multipliers (10000-scale each)
     * @returns {number} Actual speed in pixels/sec
     */
    calcActualSpeed(entityBaseSpeed, additiveMods, moveEfficiency, statusMultipliers = []) {
        let speed = entityBaseSpeed * (10000 + additiveMods) / 10000;
        speed = speed * moveEfficiency / 10000;
        for (const mult of statusMultipliers) {
            speed = speed * mult / 10000;
        }
        return Math.floor(speed);
    },

    /**
     * Calculate the final attack interval in milliseconds.
     * @param {number} typeAttackInterval - Base interval from weapon data (ms)
     * @param {number} localAttackSpeedMod - Weapon's local speed modifier (10000-scale)
     * @param {number[]} globalAttackSpeedMods - Array of global speed mods (10000-scale)
     * @returns {number} Final interval in ms (integer)
     */
    calcAttackInterval(typeAttackInterval, localAttackSpeedMod, globalAttackSpeedMods = []) {
        // Apply local mod
        let interval = Math.floor(typeAttackInterval * 10000 / (10000 + localAttackSpeedMod));
        // Apply global mods
        const globalSum = globalAttackSpeedMods.reduce((a, b) => a + b, 0);
        interval = Math.floor(interval * 10000 / (10000 + globalSum));
        return Math.max(100, interval); // Minimum 100ms to prevent division-by-zero-style abuse
    },

    /**
     * Calculate final damage dealt.
     * @param {number} attackStat - Attacker's Attack stat
     * @param {number} defenseStat - Defender part's Defense stat
     * @returns {number} FinalDamage >= 1
     */
    calcDamage(attackStat, defenseStat) {
        const mitigation = attackStat / (attackStat + defenseStat);
        return Math.max(1, Math.round(attackStat * mitigation));
    },

    /**
     * Select which Mech part is hit by an attack.
     * Uses 1:2:2:3 weighted distribution (Body:ArmL:ArmR:Legs).
     * Rerolls uniformly if selected part is already destroyed.
     * @param {object} parts - Mech parts object: { body, armLeft, armRight, legs }
     * @returns {{ key: string, part: object } | null} The targeted part and its key, or null if all destroyed
     */
    selectTargetPart(parts) {
        const PART_KEYS = ['body', 'armLeft', 'armRight', 'legs'];
        const WEIGHTS = [1, 2, 2, 3]; // total = 8
        const TOTAL_WEIGHT = 8;

        // Initial weighted roll
        const roll = Math.random() * TOTAL_WEIGHT;
        let cumulative = 0;
        let selectedKey = PART_KEYS[PART_KEYS.length - 1]; // fallback

        for (let i = 0; i < PART_KEYS.length; i++) {
            cumulative += WEIGHTS[i];
            if (roll < cumulative) {
                selectedKey = PART_KEYS[i];
                break;
            }
        }

        // Reroll if destroyed
        if (parts[selectedKey].hp <= 0) {
            const validKeys = PART_KEYS.filter(k => parts[k].hp > 0);
            if (validKeys.length === 0) return null; // All parts gone
            selectedKey = validKeys[Math.floor(Math.random() * validKeys.length)];
        }

        return { key: selectedKey, part: parts[selectedKey] };
    },

    /**
     * Resolve a projectile hit against a target entity.
     * Handles the accuracy roll, part selection (for Mech), and damage calculation.
     *
     * @param {number} accuracyRatio - Combined attacker accuracy (10000-scale)
     * @param {number} attackStat - Attacker's Attack stat
     * @param {object} target - The entity being hit. Must have either .parts (Mech) or .defense + .hp (Enemy/Terminal)
     * @returns {{ hit: boolean, partKey: string|null, damage: number }}
     */
    resolveHit(accuracyRatio, attackStat, target) {
        // Determine defender evasion
        const defenderEvasion = target.evasion ?? 0;

        // Accuracy roll
        const chanceToHit = this.calcChanceToHit(accuracyRatio, defenderEvasion);
        if (Math.random() >= chanceToHit) {
            return { hit: false, partKey: null, damage: 0 };
        }

        // Structured target (Mech with parts)
        if (target.parts) {
            const selected = this.selectTargetPart(target.parts);
            if (!selected) {
                return { hit: false, partKey: null, damage: 0 }; // All parts gone
            }
            // Shield defense bonus applies to the whole mech — added on top of the hit part's own defense.
            const shieldBonus = target.activeShieldDefenseBonus || 0;
            const damage = this.calcDamage(attackStat, selected.part.defense + shieldBonus);
            return { hit: true, partKey: selected.key, damage };
        }

        // Simple target (Enemy, Terminal)
        const defense = target.defense ?? 0;
        const damage = this.calcDamage(attackStat, defense);
        return { hit: true, partKey: null, damage };
    },

    /**
     * Combine weapon accuracy and arm accuracy multiplicatively.
     * @param {number} weaponAccuracy - Weapon's AccuracyRatio (10000-scale)
     * @param {number} armAccuracy - Arm part's AccuracyRatio (10000-scale)
     * @returns {number} Combined accuracy (10000-scale)
     */
    combineAccuracy(weaponAccuracy, armAccuracy) {
        return Math.floor(weaponAccuracy * armAccuracy / 10000);
    }
};
