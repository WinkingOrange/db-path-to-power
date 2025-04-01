import { StatKeys } from './BaseStats.js'; // Assuming StatKeys might be useful

/**
 * Manages combat-specific statistics derived from base stats and attributes.
 */
class CharacterCombatStats {
    /**
     * Creates an instance of CharacterCombatStats.
     * @param {CharacterAttributes} attributes - The character's attributes instance.
     * @param {CharacterBaseStats} baseStats - The character's base stats instance.
     * @param {CharacterDerivedStats} derivedStats - The character's derived stats instance (optional, but potentially useful).
     */
    constructor(attributes, baseStats, derivedStats = null) {
        if (!attributes || !baseStats) {
            throw new Error("CharacterCombatStats requires at least Attributes and BaseStats instances.");
        }
        this.attributes = attributes;
        this.baseStats = baseStats;
        this.derivedStats = derivedStats; // Store if provided

        // --- Combat Stats ---
        this._accuracy = 0;       // Chance to hit opponent (e.g., vs Evasion)
        this._evasion = 0;        // Chance to dodge incoming attacks (e.g., vs Accuracy)
        
        // Crit system
        this._critChance = 0;     // Total critical hit chance percentage (can exceed 100%)
        this._critDamage = 0;     // Damage multiplier on critical hit (Physical)
        this._energyCritDamage = 0; // Damage multiplier on critical hit (Energy)
        
        // Critical hit tiers and their effects
        this._critTiers = {
            normal: { 
                threshold: 0,      // 0% - No crit
                physMultiplier: 1, 
                energyMultiplier: 1,
                defenseIgnore: 0,
                guaranteedKnockback: false
            },
            regular: { 
                threshold: 1,      // 1-100% - Regular crit
                physMultiplier: 0, 
                energyMultiplier: 0,
                defenseIgnore: 0,
                guaranteedKnockback: false
            },
            super: { 
                threshold: 1.01,   // 101-200% - Super crit
                physMultiplier: 0, 
                energyMultiplier: 0,
                defenseIgnore: 0.25,  // Ignores 25% defense
                guaranteedKnockback: false
            },
            mega: { 
                threshold: 2.01,   // 201-300% - Mega crit
                physMultiplier: 0, 
                energyMultiplier: 0,
                defenseIgnore: 0.25,  // Ignores 25% defense
                guaranteedKnockback: false
            },
            omega: { 
                threshold: 3.01,   // 301%+ - OMEGA crit
                physMultiplier: 0, 
                energyMultiplier: 0,
                defenseIgnore: 0.50,  // Ignores 50% defense
                guaranteedKnockback: true // Always causes knockback
            }
        };
        
        this._knockback = 0;      // How far an attack pushes the opponent back
        this._pursuit = 0;        // Chance/Ability to follow up after knockback or certain moves

        this.updateAll(); // Calculate initial values
    }

    // --- Calculation Methods (Placeholders) ---

    /** Calculates the character's base accuracy using a diminishing returns formula. */
    calculateAccuracy() {
        const tec = this.baseStats.getStat(StatKeys.TEC);
        const agi = this.baseStats.getStat(StatKeys.AGI);
        // Formula: Base + TEC Contribution + AGI Contribution
        // Uses curve: (stat / (stat + constant)) * max_bonus
        const baseAccuracy = 50;
        const tecBonus = (tec / (tec + 60)) * 50; // Max +50 from TEC
        const agiBonus = (agi / (agi + 120)) * 25; // Max +25 from AGI
        this._accuracy = baseAccuracy + tecBonus + agiBonus;
        return this._accuracy;
    }

    /** Calculates the character's base evasion using a diminishing returns formula. */
    calculateEvasion() {
        const agi = this.baseStats.getStat(StatKeys.AGI);
        const aura = this.baseStats.getStat(StatKeys.AURA);
        // Formula: Base + AGI Contribution + AURA Contribution
        const baseEvasion = 35;
        const agiBonus = (agi / (agi + 80)) * 60;   // Max +60 from AGI
        const auraBonus = (aura / (aura + 150)) * 20; // Max +20 from AURA
        this._evasion = baseEvasion + agiBonus + auraBonus;
        return this._evasion;
    }

    /** 
     * Calculates the character's critical hit chance.
     * This can exceed 100% to support tiered critical hits.
     */
    calculateCritChance() {
        const tec = this.baseStats.getStat(StatKeys.TEC);
        const baseCrit = 0.05; // 5% base
        
        // Formula: Base + TEC Contribution - can exceed 100% with no upper limit
        // For TEC values up to about 150, behavior is similar to before
        // Beyond that, it scales to support higher tier crits
        const tecContribution = tec / 150;
        this._critChance = baseCrit + tecContribution;
        
        return this._critChance;
    }

    /** Calculates the character's critical hit damage multiplier (Physical). */
    calculateCritDamage() {
        const str = this.baseStats.getStat(StatKeys.STR);
        const baseMultiplier = 1.5; // 150% base damage
        // Formula: Base + STR Contribution (curve approaching 3.5 max bonus -> 5.0 total)
        const strBonus = (str / (str + 200)) * 3.5;
        this._critDamage = baseMultiplier + strBonus;
        
        // Set tier damage multipliers for physical
        this._critTiers.normal.physMultiplier = 1.0; // Normal hits = 100% damage
        this._critTiers.regular.physMultiplier = this._critDamage; // Regular crits = base crit damage
        this._critTiers.super.physMultiplier = this._critDamage; // Super crits = base crit damage + defense ignore
        this._critTiers.mega.physMultiplier = this._critDamage * 1.5; // Mega crits = 150% of crit damage + defense ignore
        this._critTiers.omega.physMultiplier = this._critDamage * 2.0; // OMEGA crits = 200% of crit damage + defense ignore + knockback
        
        return this._critDamage;
    }

    /** Calculates the character's critical hit damage multiplier (Energy). */
    calculateEnergyCritDamage() {
        const tec = this.baseStats.getStat(StatKeys.TEC);
        const baseMultiplier = 1.5; // 150% base damage
        // Formula: Base + TEC Contribution (curve approaching 3.5 max bonus -> 5.0 total)
        const tecBonus = (tec / (tec + 200)) * 3.5;
        this._energyCritDamage = baseMultiplier + tecBonus;
        
        // Set tier damage multipliers for energy
        this._critTiers.normal.energyMultiplier = 1.0; // Normal hits = 100% damage
        this._critTiers.regular.energyMultiplier = this._energyCritDamage; // Regular crits = base crit damage
        this._critTiers.super.energyMultiplier = this._energyCritDamage; // Super crits = base crit damage + defense ignore
        this._critTiers.mega.energyMultiplier = this._energyCritDamage * 1.5; // Mega crits = 150% of crit damage + defense ignore
        this._critTiers.omega.energyMultiplier = this._energyCritDamage * 2.0; // OMEGA crits = 200% of crit damage + defense ignore + knockback
        
        return this._energyCritDamage;
    }

    /** Calculates the character's base knockback strength using a diminishing returns formula. */
    calculateKnockback() {
        const str = this.baseStats.getStat(StatKeys.STR);
        // Formula: Base + STR Contribution (curve approaching 12 max bonus -> 15 total)
        const baseKnockback = 3;
        const strBonus = (str / (str + 50)) * 12;
        this._knockback = Math.floor(baseKnockback + strBonus);
        return this._knockback;
    }

    /** Calculates the character's pursuit capability using a diminishing returns formula. */
    calculatePursuit() {
        const agi = this.baseStats.getStat(StatKeys.AGI);
        const tec = this.baseStats.getStat(StatKeys.TEC);
        // Formula: Base + AGI Contribution + TEC Contribution
        const basePursuit = 5;
        const agiBonus = (agi / (agi + 75)) * 30; // Max +30 from AGI
        const tecBonus = (tec / (tec + 150)) * 15; // Max +15 from TEC
        this._pursuit = Math.floor(basePursuit + agiBonus + tecBonus);
        return this._pursuit;
    }

    // --- Update & Getters ---

    /** Recalculates all combat stats. Should be called when base stats or attributes change. */
    updateAll() {
        this.calculateAccuracy();
        this.calculateEvasion();
        this.calculateCritChance();
        this.calculateCritDamage();
        this.calculateEnergyCritDamage();
        this.calculateKnockback();
        this.calculatePursuit();
    }

    /** Gets the current accuracy value. */
    get accuracy() { return this._accuracy; }

    /** Gets the current evasion value. */
    get evasion() { return this._evasion; }

    /** Gets the current critical hit chance (can exceed 1.0). */
    get critChance() { return this._critChance; }

    /** Gets the calculated critical damage multiplier (Physical). */
    get critDamage() { return this._critDamage; }

    /** Gets the calculated critical damage multiplier (Energy). */
    get energyCritDamage() { return this._energyCritDamage; }
    
    /** Gets all critical hit tier information. */
    get critTiers() { return this._critTiers; }
    
    /** Gets the effective critical hit chance (capped at 100%). */
    get effectiveCritChance() { return Math.min(this._critChance, 1.0); }
    
    /** Gets whether the character has a chance to land a Super critical hit. */
    get canSuperCrit() { return this._critChance >= this._critTiers.super.threshold; }
    
    /** Gets whether the character has a chance to land a Mega critical hit. */
    get canMegaCrit() { return this._critChance >= this._critTiers.mega.threshold; }
    
    /** Gets whether the character has a chance to land an OMEGA critical hit. */
    get canOmegaCrit() { return this._critChance >= this._critTiers.omega.threshold; }
    
    /** Gets the chance for a critical hit to become a Super critical (0-100%). */
    get superCritChance() { 
        if (this._critChance < this._critTiers.super.threshold) return 0;
        return Math.min(this._critChance - this._critTiers.super.threshold + 0.01, 1.0);
    }
    
    /** Gets the chance for a critical hit to become a Mega critical (0-100%). */
    get megaCritChance() { 
        if (this._critChance < this._critTiers.mega.threshold) return 0;
        return Math.min(this._critChance - this._critTiers.mega.threshold + 0.01, 1.0);
    }
    
    /** Gets the chance for a critical hit to become an OMEGA critical (0-100%). */
    get omegaCritChance() { 
        if (this._critChance < this._critTiers.omega.threshold) return 0;
        return Math.min(this._critChance - this._critTiers.omega.threshold + 0.01, 1.0);
    }
    
    /**
     * Gets critical hit damage multiplier for a specific tier and damage type.
     * @param {string} tier - The critical hit tier ('normal', 'regular', 'super', 'mega', 'omega')
     * @param {string} damageType - The damage type ('physical' or 'energy')
     * @returns {number} - The damage multiplier for the specified tier and damage type
     */
    getCritMultiplier(tier = 'normal', damageType = 'physical') {
        const tierKey = tier.toLowerCase();
        if (!this._critTiers[tierKey]) {
            console.warn(`Unknown critical hit tier: ${tier}`);
            return 1.0; // Default to normal damage
        }
        
        return damageType.toLowerCase() === 'energy' 
            ? this._critTiers[tierKey].energyMultiplier 
            : this._critTiers[tierKey].physMultiplier;
    }
    
    /**
     * Gets the amount of defense to ignore for a specific critical hit tier.
     * @param {string} tier - The critical hit tier ('normal', 'regular', 'super', 'mega', 'omega')
     * @returns {number} - The percentage of defense to ignore (0.0 to 1.0)
     */
    getCritDefenseIgnore(tier = 'normal') {
        const tierKey = tier.toLowerCase();
        if (!this._critTiers[tierKey]) {
            console.warn(`Unknown critical hit tier: ${tier}`);
            return 0;
        }
        
        return this._critTiers[tierKey].defenseIgnore;
    }
    
    /**
     * Determines if a critical hit causes guaranteed knockback.
     * @param {string} tier - The critical hit tier ('normal', 'regular', 'super', 'mega', 'omega')
     * @returns {boolean} - Whether the critical hit guarantees knockback
     */
    getCritKnockback(tier = 'normal') {
        const tierKey = tier.toLowerCase();
        if (!this._critTiers[tierKey]) {
            console.warn(`Unknown critical hit tier: ${tier}`);
            return false;
        }
        
        return this._critTiers[tierKey].guaranteedKnockback;
    }
    
    /**
     * Determines the critical hit tier for an attack based on a random roll.
     * Implements the cascading tier check system.
     * @returns {string} - The critical hit tier ('normal', 'regular', 'super', 'mega', 'omega')
     */
    rollCriticalHit() {
        // First, check if we get a critical hit at all
        // This is capped at 100% chance
        const critRoll = Math.random();
        if (critRoll > Math.min(this._critChance, 1.0)) {
            return 'normal'; // No critical hit
        }
        
        // We've got a critical hit, now determine the tier
        // Check for OMEGA tier first (301%+)
        if (this._critChance >= this._critTiers.omega.threshold) {
            // Chance for OMEGA = excess percentage over threshold
            const omegaChance = (this._critChance - this._critTiers.omega.threshold + 0.01) / 
                               (this._critTiers.omega.threshold - this._critTiers.mega.threshold);
            if (Math.random() <= Math.min(omegaChance, 1.0)) {
                return 'omega';
            }
        }
        
        // Check for Mega tier (201-300%)
        if (this._critChance >= this._critTiers.mega.threshold) {
            // Chance for Mega = excess percentage over threshold or 100% if past the next tier
            const megaChance = (this._critChance - this._critTiers.mega.threshold + 0.01) / 
                              (this._critTiers.mega.threshold - this._critTiers.super.threshold);
            if (Math.random() <= Math.min(megaChance, 1.0)) {
                return 'mega';
            }
        }
        
        // Check for Super tier (101-200%)
        if (this._critChance >= this._critTiers.super.threshold) {
            // Chance for Super = excess percentage over threshold or 100% if past the next tier
            const superChance = (this._critChance - this._critTiers.super.threshold + 0.01) / 
                               (this._critTiers.super.threshold - this._critTiers.regular.threshold);
            if (Math.random() <= Math.min(superChance, 1.0)) {
                return 'super';
            }
        }
        
        // If we got a crit but none of the higher tiers, it's a regular crit
        return 'regular';
    }

    /** Gets the current knockback strength value. */
    get knockback() { return this._knockback; }

    /** Gets the current pursuit value (meaning depends on implementation). */
    get pursuit() { return this._pursuit; }

    // --- Utility ---

    /**
     * Updates combat stats based on changes in underlying stats.
     * Placeholder for more specific update logic if needed, otherwise updateAll covers it.
     */
    handleStatChange() {
        // Could potentially recalculate only affected stats if performance becomes an issue
        this.updateAll();
    }
}

// Export the class
export { CharacterCombatStats };
