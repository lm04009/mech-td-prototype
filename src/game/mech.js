import { CONFIG } from './Config.js';
import { Collision } from '../engine/Collision.js';
import { CombatSystem } from '../engine/CombatSystem.js';
import { Projectile } from './projectile.js';

/**
 * Mech — the player-controlled unit.
 *
 * Weapon slots:
 *   armLeft.grip     → Right Mouse Button
 *   armRight.grip    → Key 1
 *   armLeft.shoulder → Key 2
 *   armRight.shoulder→ Key 3
 *
 * Stats are derived from parts.json / weapons.json via DataStore.
 */
export class Mech {
    constructor(x, y, eventBus, dataStore) {
        this.x = x;
        this.y = y;
        this.eventBus = eventBus;
        this.size = 40;
        this.color = '#00ff00';

        // Faction / damageable interface
        this.faction = CONFIG.FACTION.PLAYER;
        this.damageFlashTimer = 0;
        this.destructionSparks = [];

        // --- Load parts from data ---
        const loadout = CONFIG.STARTING_LOADOUT;
        const bodyData = dataStore.getPartById('Body', loadout.body.id);
        const armLData = dataStore.getPartById('Arm', loadout.armLeft.id);
        const armRData = dataStore.getPartById('Arm', loadout.armRight.id);
        const legsData = dataStore.getPartById('Legs', loadout.legs.id);

        this.parts = {
            body: { name: bodyData.Name, hp: bodyData.HP, maxHp: bodyData.HP, defense: bodyData.Defense },
            armLeft: { name: armLData.Name, hp: armLData.HP, maxHp: armLData.HP, defense: armLData.Defense, accuracyRatio: armLData.AccuracyRatio },
            armRight: { name: armRData.Name, hp: armRData.HP, maxHp: armRData.HP, defense: armRData.Defense, accuracyRatio: armRData.AccuracyRatio },
            legs: { name: legsData.Name, hp: legsData.HP, maxHp: legsData.HP, defense: legsData.Defense }
        };

        // --- Load weapon slots from data ---
        const slotCfg = loadout.slots;
        this.slots = {
            armLeft: {
                grip: this._initSlot(dataStore, armLData, slotCfg.armLeft.grip),
                shoulder: this._initSlot(dataStore, armLData, slotCfg.armLeft.shoulder)
            },
            armRight: {
                grip: this._initSlot(dataStore, armRData, slotCfg.armRight.grip),
                shoulder: this._initSlot(dataStore, armRData, slotCfg.armRight.shoulder)
            }
        };

        // --- Derived combat / movement stats ---
        const allWeaponWeights = this._sumWeaponWeights();
        this.totalWeight = (bodyData.Weight || 0) + (armLData.Weight || 0) + (armRData.Weight || 0) + (legsData.Weight || 0) + allWeaponWeights;
        this.totalPowerOutput = (bodyData.PowerOutput || 0) + (legsData.PowerOutput || 0);

        const moveEfficiency = CombatSystem.calcMoveEfficiency(this.totalWeight, this.totalPowerOutput);
        const additiveMods = (legsData.MovementSpeedMod || 0);
        this.speed = CombatSystem.calcActualSpeed(CONFIG.MECH_BASE_SPEED, additiveMods, moveEfficiency);

        this.evasion = CombatSystem.calcEvasion(this.totalWeight, this.totalPowerOutput);

        this.angle = 0; // Facing angle in radians
    }

    /**
     * Create a slot object from weapon ID (or null for empty slot).
     * @param {object} dataStore
     * @param {object} armData - The arm part data this slot belongs to
     * @param {number|null} weaponId
     * @returns {object|null}
     */
    _initSlot(dataStore, armData, weaponId) {
        if (!weaponId) return null;
        const weaponData = dataStore.getWeaponById(weaponId);
        if (!weaponData) {
            console.warn(`[Mech] Weapon ID ${weaponId} not found in DataStore.`);
            return null;
        }
        const intervalMs = CombatSystem.calcAttackInterval(
            weaponData.TypeAttackInterval,
            weaponData.LocalAttackSpeedMod || 0,
            []
        );
        const combinedAccuracy = CombatSystem.combineAccuracy(
            weaponData.AccuracyRatio || 10000,
            armData.AccuracyRatio || 10000
        );

        const isShield = weaponData.Type === 'Shield';

        const slot = {
            weaponData,
            intervalMs,
            combinedAccuracy,
            isShield,
            currentCooldownMs: 0
        };

        if (isShield) {
            // Shields run an automatic active→cooldown→active cycle. No player input.
            // TODO: SHIELD_ACTIVE_DURATION_MS should eventually come from weapon data.
            slot.shieldActiveMs = CONFIG.SHIELD_ACTIVE_DURATION_MS;
            slot.shieldCooldownMs = 0;
            slot.shieldIsActive = true; // Starts active
        }

        return slot;
    }

    _sumWeaponWeights() {
        let total = 0;
        for (const arm of ['armLeft', 'armRight']) {
            for (const type of ['grip', 'shoulder']) {
                const slot = this.slots?.[arm]?.[type];
                if (slot) total += slot.weaponData.Weight || 0;
            }
        }
        return total;
    }

    /** Check whether a given slot is usable (arm alive + weapon equipped). */
    _slotUsable(armKey, slotType) {
        if (this.parts[armKey].hp <= 0) return false;
        return this.slots[armKey][slotType] !== null;
    }

    /**
     * Compute the barrel world position for a given arm.
     * @param {'armLeft'|'armRight'} armKey
     * @returns {{ x: number, y: number }}
     */
    _barrelPosition(armKey) {
        const side = armKey === 'armLeft' ? -1 : 1;
        const mountOffsetX = side * this.size / 2;
        const mountOffsetY = -this.size / 2;

        const c = Math.cos(this.angle + Math.PI / 2);
        const s = Math.sin(this.angle + Math.PI / 2);

        return {
            x: this.x + (mountOffsetX * c - mountOffsetY * s),
            y: this.y + (mountOffsetX * s + mountOffsetY * c)
        };
    }

    /**
     * Attempt to fire a specific slot toward a target position.
     * Returns an array of new Projectile objects (may be empty).
     * @param {'armLeft'|'armRight'} armKey
     * @param {'grip'|'shoulder'} slotType
     * @param {{ x: number, y: number }} target - World position of mouse
     * @returns {Projectile[]}
     */
    fireSlot(armKey, slotType, target) {
        if (!this._slotUsable(armKey, slotType)) return [];

        const slot = this.slots[armKey][slotType];
        if (slot.currentCooldownMs > 0) return [];

        const weaponData = slot.weaponData;

        // DeliveryType guard — Swing not implemented
        if (weaponData.DeliveryType === 'Swing') {
            // Melee deferred — do nothing silently
            return [];
        }

        const barrel = this._barrelPosition(armKey);
        const dx = target.x - barrel.x;
        const dy = target.y - barrel.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Range check: both min and max (in tiles → world pixels)
        const rangeMaxPixels = weaponData.RangeMax * CONFIG.TILE_SIZE;
        const rangeMinPixels = (weaponData.RangeMin || 1) * CONFIG.TILE_SIZE;
        if (dist > rangeMaxPixels) return []; // Too far
        if (dist < rangeMinPixels) return []; // Too close (e.g. missile launchers)
        const rangePixels = rangeMaxPixels; // Used for projectile travel distance

        const baseAngle = Math.atan2(dy, dx);
        const count = Math.max(1, weaponData.ProjectilesPerRound || 1);
        const projectiles = [];

        for (let i = 0; i < count; i++) {
            let angle = baseAngle;

            if (weaponData.DeliveryType === 'Fan' && count > 1) {
                const spreadRad = (CONFIG.FAN_SPREAD_DEGREES * Math.PI / 180);
                const step = spreadRad / (count - 1);
                angle = baseAngle - spreadRad / 2 + step * i;
            }
            // Linear: all at same angle

            const p = new Projectile(
                barrel.x, barrel.y,
                angle,
                400,              // Projectile speed px/s
                rangePixels,
                this.faction,
                weaponData.Attack,
                slot.combinedAccuracy
            );
            p.color = '#ffff00';
            projectiles.push(p);
        }

        // Start cooldown on first spawn (per BasicConcepts.md)
        slot.currentCooldownMs = slot.intervalMs;

        return projectiles;
    }

    update(dt, inputVector, mousePos, inputState, game) {
        const dtMs = dt * 1000;

        // Damage Flash
        if (this.damageFlashTimer > 0) this.damageFlashTimer -= dt;

        // Destruction spark decay
        for (let i = this.destructionSparks.length - 1; i >= 0; i--) {
            this.destructionSparks[i].timer -= dt;
            if (this.destructionSparks[i].timer <= 0) this.destructionSparks.splice(i, 1);
        }

        // Cooldown tick for all slots; shield cycle management
        for (const arm of ['armLeft', 'armRight']) {
            for (const type of ['grip', 'shoulder']) {
                const slot = this.slots[arm][type];
                if (!slot) continue;

                if (slot.isShield) {
                    // Shield runs its own automatic cycle independent of player input
                    if (slot.shieldIsActive) {
                        slot.shieldActiveMs = Math.max(0, slot.shieldActiveMs - dtMs);
                        if (slot.shieldActiveMs <= 0) {
                            // Active window expired → enter cooldown
                            slot.shieldIsActive = false;
                            slot.shieldCooldownMs = slot.intervalMs;
                        }
                    } else {
                        slot.shieldCooldownMs = Math.max(0, slot.shieldCooldownMs - dtMs);
                        if (slot.shieldCooldownMs <= 0) {
                            // Cooldown expired → become active again
                            slot.shieldIsActive = true;
                            slot.shieldActiveMs = CONFIG.SHIELD_ACTIVE_DURATION_MS;
                        }
                    }
                } else {
                    if (slot.currentCooldownMs > 0) {
                        slot.currentCooldownMs = Math.max(0, slot.currentCooldownMs - dtMs);
                    }
                }
            }
        }

        // Compute total active shield defense bonus for this frame
        // Applied to ALL incoming hits against the mech while at least one shield is active.
        let shieldBonus = 0;
        for (const arm of ['armLeft', 'armRight']) {
            for (const type of ['grip', 'shoulder']) {
                const slot = this.slots[arm][type];
                if (slot && slot.isShield && slot.shieldIsActive && this.parts[arm].hp > 0) {
                    shieldBonus += (slot.weaponData.Defense || 0);
                }
            }
        }
        this.activeShieldDefenseBonus = shieldBonus;

        // Movement
        if (inputVector.x !== 0 || inputVector.y !== 0) {
            let currentSpeed = this.speed;
            if (this.parts.legs.hp <= 0) {
                currentSpeed = Math.floor(currentSpeed * 5000 / 10000);
            }

            let dx = inputVector.x * currentSpeed * dt;
            let dy = inputVector.y * currentSpeed * dt;

            // X-axis slide
            let nextX = this.x + dx;
            if (this.checkCollision(nextX, this.y, game)) dx = 0;
            this.x += dx;

            // Y-axis slide
            let nextY = this.y + dy;
            if (this.checkCollision(this.x, nextY, game)) dy = 0;
            this.y += dy;
        }

        // Face mouse
        if (mousePos) {
            this.angle = Math.atan2(mousePos.y - this.y, mousePos.x - this.x);
        }

        // Weapon firing — return all new projectiles as an array
        const newProjectiles = [];
        if (inputState && mousePos) {
            if (inputState.isRightDown) {
                newProjectiles.push(...this.fireSlot('armLeft', 'grip', mousePos));
            }
            if (inputState.key1) {
                newProjectiles.push(...this.fireSlot('armRight', 'grip', mousePos));
            }
            if (inputState.key2) {
                newProjectiles.push(...this.fireSlot('armLeft', 'shoulder', mousePos));
            }
            if (inputState.key3) {
                newProjectiles.push(...this.fireSlot('armRight', 'shoulder', mousePos));
            }
        }

        return newProjectiles;
    }

    checkCollision(x, y, game) {
        const map = game.map;
        const entities = game.entities;
        const radius = (this.size / 2) * 0.8;

        const queryRect = { x: x - radius, y: y - radius, width: radius * 2, height: radius * 2 };
        const obstacles = map.getObstacles(queryRect);
        const myCircle = { x, y, radius };

        for (const obs of obstacles) {
            if (Collision.checkCircleRect(myCircle, obs)) return true;
        }

        if (entities) {
            for (const enemy of entities.enemies) {
                if (enemy.hp > 0 && Collision.checkCircleCircle(myCircle, { x: enemy.x, y: enemy.y, radius: enemy.size / 2 })) {
                    return true;
                }
            }
        }

        const term = game.terminal;
        if (term && term.hp > 0) {
            const termRect = { x: term.x - term.width / 2, y: term.y - term.height / 2, width: term.width, height: term.height };
            if (Collision.checkCircleRect(myCircle, termRect)) return true;
        }

        return false;
    }

    /**
     * Called when a projectile hits the Mech. Applies damage to specified part.
     * partKey comes from CombatSystem.resolveHit.
     */
    applyPartDamage(partKey, damage) {
        const part = this.parts[partKey];
        const wasAlive = part.hp > 0;
        part.hp = Math.max(0, part.hp - damage);

        // Trigger destruction sparks
        if (wasAlive && part.hp === 0 && partKey !== 'body') {
            let offsetX = 0, offsetY = 0;
            if (partKey === 'armLeft') { offsetX = -this.size / 2 - 5; }
            if (partKey === 'armRight') { offsetX = this.size / 2 - 5; }
            if (partKey === 'legs') { offsetY = this.size / 4; }
            this.destructionSparks.push({ x: offsetX, y: offsetY, timer: 0.5, maxTimer: 0.5 });
        }

        this.damageFlashTimer = 0.1;

        if (this.eventBus) {
            this.eventBus.emit('mech:damage', {
                hp: this.parts.body.hp,
                maxHp: this.parts.body.maxHp,
                parts: this.parts
            });
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);

        // --- Draw all equipped weapon range rings ---
        const SLOT_COLORS = CONFIG.SLOT_COLORS;
        const slotDefs = [
            { arm: 'armLeft', type: 'grip', colorKey: 'armLeft_grip', sideX: -1 },
            { arm: 'armRight', type: 'grip', colorKey: 'armRight_grip', sideX: 1 },
            { arm: 'armLeft', type: 'shoulder', colorKey: 'armLeft_shoulder', sideX: -1 },
            { arm: 'armRight', type: 'shoulder', colorKey: 'armRight_shoulder', sideX: 1 },
        ];

        for (const def of slotDefs) {
            if (!this._slotUsable(def.arm, def.type)) continue;
            const slot = this.slots[def.arm][def.type];
            if (slot.isShield) continue; // Shields have no range ring

            const wd = slot.weaponData;
            const maxPx = wd.RangeMax * CONFIG.TILE_SIZE;
            const minPx = (wd.RangeMin || 1) * CONFIG.TILE_SIZE;
            const cx = def.sideX * this.size / 2;
            const cy = -this.size / 2;
            const color = SLOT_COLORS[def.colorKey];

            // Max range ring (solid)
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(cx, cy, maxPx, 0, Math.PI * 2);
            ctx.stroke();

            // Min range ring (dashed) — only draw if meaningfully different from max
            if (wd.RangeMin > 1) {
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.arc(cx, cy, minPx, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // --- Draw Legs (base) ---
        ctx.fillStyle = this.parts.legs.hp > 0 ? '#004400' : '#222';
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

        // --- Draw Torso ---
        if (this.damageFlashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.fillRect(-this.size / 3, -this.size / 3, this.size / 1.5, this.size / 1.5);

        // --- Draw Left Arm ---
        if (this.parts.armLeft.hp > 0) {
            ctx.fillStyle = '#00aa00';
            ctx.fillRect(-this.size / 2 - 5, -5, 10, 10);

            // Draw Grip weapon barrel
            const lgSlot = this.slots.armLeft.grip;
            if (lgSlot && lgSlot.weaponData.ProjectilesPerRound > 0) {
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(-this.size / 2 - 2, -this.size / 2, 4, 15);
            }
            // Draw Shoulder weapon (small block)
            const lsSlot = this.slots.armLeft.shoulder;
            if (lsSlot) {
                ctx.fillStyle = '#ff8800';
                ctx.fillRect(-this.size / 2 - 4, -this.size / 2 + 5, 8, 8);
            }
        } else {
            ctx.fillStyle = '#555555';
            ctx.fillRect(-this.size / 2 - 2, -3, 4, 6);
        }

        // --- Draw Right Arm ---
        if (this.parts.armRight.hp > 0) {
            ctx.fillStyle = '#00aa00';
            ctx.fillRect(this.size / 2 - 5, -5, 10, 10);

            const rgSlot = this.slots.armRight.grip;
            if (rgSlot && rgSlot.weaponData.ProjectilesPerRound > 0) {
                ctx.fillStyle = '#00ffff';
                ctx.fillRect(this.size / 2 - 2, -this.size / 2, 4, 15);
            }
            const rsSlot = this.slots.armRight.shoulder;
            if (rsSlot) {
                ctx.fillStyle = '#8800ff';
                ctx.fillRect(this.size / 2 - 4, -this.size / 2 + 5, 8, 8);
            }
        } else {
            ctx.fillStyle = '#555555';
            ctx.fillRect(this.size / 2 - 2, -3, 4, 6);
        }

        // --- Destruction Sparks ---
        for (const spark of this.destructionSparks) {
            const progress = 1.0 - (spark.timer / spark.maxTimer);
            const r = 5 + progress * 40;
            const alpha = spark.timer / spark.maxTimer;
            ctx.fillStyle = `rgba(255, 50, 0, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, r * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
