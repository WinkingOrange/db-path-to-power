// src/systems/Resources.js

import { StatKeys } from './BaseStats.js';

// Define keys for resources for consistency
export const ResourceKeys = Object.freeze({
    HEALTH: 'health',
    KI: 'ki',
    STAMINA: 'stamina',
    FATIGUE: 'fatigue',
});

export class CharacterResources {
    constructor(attributes, baseStats) {
        if (!attributes || !baseStats) {
            throw new Error("CharacterResources requires both Attributes and BaseStats instances.");
        }
        this.attributes = attributes;
        this.baseStats = baseStats;

        // Maximum values (calculated)
        this.maxHealth = 0;
        this.maxKi = 0;
        this.maxStamina = 0;

        // Current values
        this[ResourceKeys.HEALTH] = 0;
        this[ResourceKeys.KI] = 0;
        this[ResourceKeys.STAMINA] = 0;
        this[ResourceKeys.FATIGUE] = 0; // Starts at 0, increases with exertion

        this.calculateMaxValues();
        this.setToMax(); // Initialize current values to their maximums
    }

    // Calculate maximum resource values based on base stats and level
    // (These formulas are simple examples and can be refined)
    calculateMaxValues() {
        const level = this.attributes.level;
        const vit = this.baseStats.getStat(StatKeys.VIT);
        const wis = this.baseStats.getStat(StatKeys.WIS);
        const aura = this.baseStats.getStat(StatKeys.AURA);
        const agi = this.baseStats.getStat(StatKeys.AGI);
        const baseHp = this.baseStats.getStat(StatKeys.HP);
        const baseKi = this.baseStats.getStat(StatKeys.KI);
        const baseSta = this.baseStats.getStat(StatKeys.STA);

        // Example Formulas: Base Stat + (Level * Multiplier) + (Relevant Stat * Multiplier)
        this.maxHealth = Math.floor(baseHp + (level * 10) + (vit * 5));
        this.maxKi = Math.floor(baseKi + (level * 5) + (wis * 3) + (aura * 2));
        this.maxStamina = Math.floor(baseSta + (level * 5) + (vit * 2) + (agi * 3));

        console.log(`Calculated Max Resources: HP=${this.maxHealth}, Ki=${this.maxKi}, Stamina=${this.maxStamina}`);
    }

    // Set current resources to their calculated maximum values
    setToMax() {
        this[ResourceKeys.HEALTH] = this.maxHealth;
        this[ResourceKeys.KI] = this.maxKi;
        this[ResourceKeys.STAMINA] = this.maxStamina;
        console.log("Resources set to maximum.");
    }

    // --- Resource Modification Methods ---

    // Modify a resource value, ensuring it stays within bounds [min, max]
    _modifyResource(key, amount, min = 0, max) {
        if (!this.hasOwnProperty(key)) {
            console.warn(`Invalid resource key: ${key}`);
            return this[key]; // Return current value if key is invalid
        }
        const originalValue = this[key];
        this[key] += amount;
        this[key] = Math.max(min, Math.min(this[key], max)); // Clamp value
        const change = this[key] - originalValue; // Actual change applied

        if (change !== 0) {
             console.log(`${key} changed by ${change}. New value: ${this[key]}/${max}`);
        }
        return this[key]; // Return the new value
    }

    // Health specific methods
    takeDamage(amount) {
        if (amount <= 0) return this.health;
        console.log(`Taking ${amount} damage...`);
        return this._modifyResource(ResourceKeys.HEALTH, -amount, 0, this.maxHealth);
    }

    restoreHealth(amount) {
        if (amount <= 0) return this.health;
        console.log(`Restoring ${amount} health...`);
        return this._modifyResource(ResourceKeys.HEALTH, amount, 0, this.maxHealth);
    }

    // Ki specific methods
    useKi(amount) {
        if (amount <= 0) return this.ki;
        if (this.ki < amount) {
             console.warn(`Not enough Ki. Required: ${amount}, Available: ${this.ki}`);
             return false; // Indicate failure
        }
        console.log(`Using ${amount} Ki...`);
        this._modifyResource(ResourceKeys.KI, -amount, 0, this.maxKi);
        return true; // Indicate success
    }

    restoreKi(amount) {
        if (amount <= 0) return this.ki;
        console.log(`Restoring ${amount} Ki...`);
        return this._modifyResource(ResourceKeys.KI, amount, 0, this.maxKi);
    }

    // Stamina specific methods
    useStamina(amount) {
        if (amount <= 0) return this.stamina;
         if (this.stamina < amount) {
             console.warn(`Not enough Stamina. Required: ${amount}, Available: ${this.stamina}`);
             return false; // Indicate failure
        }
        console.log(`Using ${amount} Stamina...`);
        this._modifyResource(ResourceKeys.STAMINA, -amount, 0, this.maxStamina);
        // Using stamina often increases fatigue
        this.addFatigue(Math.ceil(amount * 0.1)); // Example: fatigue increases by 10% of stamina cost
        return true; // Indicate success
    }

    recoverStamina(amount) {
        if (amount <= 0) return this.stamina;
        console.log(`Recovering ${amount} Stamina...`);
        // Stamina recovery might be hindered by fatigue (add logic later if needed)
        return this._modifyResource(ResourceKeys.STAMINA, amount, 0, this.maxStamina);
    }

    // Fatigue specific methods
    addFatigue(amount) {
        if (amount <= 0) return this.fatigue;
        const maxFatigue = 100; // Example max fatigue
        console.log(`Adding ${amount} Fatigue...`);
        return this._modifyResource(ResourceKeys.FATIGUE, amount, 0, maxFatigue);
    }

    reduceFatigue(amount) {
        if (amount <= 0) return this.fatigue;
        const maxFatigue = 100; // Ensure consistency
        console.log(`Reducing ${amount} Fatigue...`);
        return this._modifyResource(ResourceKeys.FATIGUE, -amount, 0, maxFatigue);
    }

     // Method to update resources based on new stats (e.g., after level up or stat allocation)
    updateOnStatChange() {
        const oldMaxHealth = this.maxHealth;
        const oldMaxKi = this.maxKi;
        const oldMaxStamina = this.maxStamina;

        this.calculateMaxValues();

        // Optionally adjust current resources based on max changes
        // For simplicity now, just ensure current isn't over new max
        this[ResourceKeys.HEALTH] = Math.min(this[ResourceKeys.HEALTH], this.maxHealth);
        this[ResourceKeys.KI] = Math.min(this[ResourceKeys.KI], this.maxKi);
        this[ResourceKeys.STAMINA] = Math.min(this[ResourceKeys.STAMINA], this.maxStamina);

        // Or, proportionally increase current HP/Ki/Stam based on the increase in max
        // this.health = Math.floor(this.health * (this.maxHealth / oldMaxHealth));
        // etc.

        console.log("Resources updated due to stat changes.");
    }

    /**
     * Recalculates maximum resource values based on current base stats and attributes.
     * Also ensures current resources do not exceed the new maximums.
     */
    handleStatChange() {
        console.log("Resources detected stat change, recalculating max values...");
        const oldMaxHealth = this.maxHealth;
        const oldMaxKi = this.maxKi;
        const oldMaxStamina = this.maxStamina;

        this.calculateMaxValues(); // Recalculate maximums

        // Optional: Adjust current values proportionally if max decreased?
        // Or just cap them at the new max.
        this[ResourceKeys.HEALTH] = Math.min(this[ResourceKeys.HEALTH], this.maxHealth);
        this[ResourceKeys.KI] = Math.min(this[ResourceKeys.KI], this.maxKi);
        this[ResourceKeys.STAMINA] = Math.min(this[ResourceKeys.STAMINA], this.maxStamina);

        console.log(`Max values updated. HP: ${oldMaxHealth}=>${this.maxHealth}, Ki: ${oldMaxKi}=>${this.maxKi}, Stamina: ${oldMaxStamina}=>${this.maxStamina}`);

        // Important: After updating max values, derived stats might need updating too!
        // This dependency should be handled by the Character class triggering DerivedStats.handleStatChange
    }
}

// --- Example Usage (requires Attributes and BaseStats setup) ---
/*
import { CharacterAttributes, Race } from './Attributes.js';
import { CharacterBaseStats, StatKeys } from './BaseStats.js';

// 1. Create dependent instances
const playerBaseStats = new CharacterBaseStats({ str: 12, agi: 15, vit: 11, wis: 14, hp: 110 });
const playerAttributes = new CharacterAttributes({
    race: Race.SAIYAN,
    potential: 0.15,
    baseStats: playerBaseStats // Link stats
});

// 2. Create Resources instance
const playerResources = new CharacterResources(playerAttributes, playerBaseStats);
console.log("Initial Resources:", playerResources);

// 3. Test resource modifications
playerResources.takeDamage(30);
playerResources.useKi(20);
playerResources.useStamina(40);
playerResources.addFatigue(15);
console.log("After actions:", playerResources);

playerResources.restoreHealth(10);
playerResources.recoverStamina(25);
playerResources.restoreKi(50); // More than max, should clamp
playerResources.reduceFatigue(10);
console.log("After recovery:", playerResources);

// 4. Test update after stat change
playerAttributes.addXP(150); // Level up
playerAttributes.allocateStatPoint(StatKeys.VIT); // Allocate point affecting resources
playerResources.updateOnStatChange(); // Recalculate based on new stats/level
console.log("After level up and stat allocation:", playerResources);

playerResources.setToMax(); // Refill after level up
console.log("Resources refilled:", playerResources);
*/
