import { StatKeys } from './BaseStats.js'; // For accessing VIT, AURA etc.

// Define keys for different resistance types for consistency
const ResistanceKeys = {
    PHYSICAL: 'physicalResist',
    ENERGY: 'energyResist',
    STATUS: 'statusResist',
    // Add more specific types if needed later (e.g., HEAT, COLD, POISON)
};

/**
 * Manages character resistances to various types of damage and effects.
 * Resistances are typically represented as a percentage reduction (e.g., 0.1 = 10%).
 */
class CharacterResistances {
    /**
     * Creates an instance of CharacterResistances.
     * @param {CharacterAttributes} attributes - The character's attributes instance.
     * @param {CharacterBaseStats} baseStats - The character's base stats instance.
     */
    constructor(attributes, baseStats) {
        if (!attributes || !baseStats) {
            throw new Error("CharacterResistances requires Attributes and BaseStats instances.");
        }
        this.attributes = attributes;
        this.baseStats = baseStats;

        // --- Resistance Values ---
        this._physicalResist = 0; // e.g., 0.0 to 1.0 (or higher with buffs?)
        this._energyResist = 0;
        this._statusResist = 0;
        // Initialize other specific resistances if added to ResistanceKeys

        this.updateAll(); // Calculate initial values
    }

    // --- Calculation Methods (Placeholders) ---

    /** Calculates physical damage resistance using a diminishing returns formula. */
    calculatePhysicalResistance() {
        const vit = this.baseStats.getStat(StatKeys.VIT);
        // Formula: (vit / (vit + Constant)) * MaxResist provides natural diminishing returns.
        // Constant determines how quickly the curve flattens. MaxResist sets the theoretical cap.
        const denominatorConstant = 100;
        const maxResistance = 0.90; // 90% cap
        this._physicalResist = Math.min((vit / (vit + denominatorConstant)) * maxResistance, maxResistance);
        return this._physicalResist;
    }

    /** Calculates energy damage resistance using a diminishing returns formula. */
    calculateEnergyResistance() {
        const aura = this.baseStats.getStat(StatKeys.AURA);
        // Using the same curve as physical resistance for consistency.
        const denominatorConstant = 100;
        const maxResistance = 0.90; // 90% cap
        this._energyResist = Math.min((aura / (aura + denominatorConstant)) * maxResistance, maxResistance);
        return this._energyResist;
    }

    /** Calculates resistance to status effects using weighted contributions and diminishing returns. */
    calculateStatusResistance() {
        const vit = this.baseStats.getStat(StatKeys.VIT);
        const wis = this.baseStats.getStat(StatKeys.WIS);
        const aura = this.baseStats.getStat(StatKeys.AURA);

        const denominatorConstant = 120; // Shared constant for status resist curves
        const maxResistance = 0.85; // 85% cap for status effects

        // Weighted contribution with diminishing returns for each stat
        const vitContribution = (vit / (vit + denominatorConstant)) * 0.40; // 40% weight to VIT
        const wisContribution = (wis / (wis + denominatorConstant)) * 0.30; // 30% weight to WIS
        const auraContribution = (aura / (aura + denominatorConstant)) * 0.15; // 15% weight to AURA

        // Combine and cap
        this._statusResist = Math.min((vitContribution + wisContribution + auraContribution), maxResistance);
        return this._statusResist;
    }

    // --- Update & Getters ---

    /** Recalculates all resistances. Should be called when base stats or attributes change. */
    updateAll() {
        this.calculatePhysicalResistance();
        this.calculateEnergyResistance();
        this.calculateStatusResistance();
        // Add calls for any new resistance types here
    }

    /** Gets the current physical resistance value (0.0 to 1.0+). */
    get physical() { return this._physicalResist; }

    /** Gets the current energy resistance value (0.0 to 1.0+). */
    get energy() { return this._energyResist; }

    /** Gets the current status effect resistance value (interpretation depends on formula). */
    get status() { return this._statusResist; }

    /**
     * Generic getter for resistance by key.
     * @param {string} key - The key from ResistanceKeys.
     * @returns {number} The resistance value.
     */
    getResistance(key) {
        switch (key) {
            case ResistanceKeys.PHYSICAL: return this.physical;
            case ResistanceKeys.ENERGY: return this.energy;
            case ResistanceKeys.STATUS: return this.status;
            default:
                return 0;
        }
    }

    // --- Utility ---

    /** Handles changes in underlying stats, recalculating resistances. */
    handleStatChange() {
        this.updateAll();
    }

}

// Export the class and keys
export { CharacterResistances, ResistanceKeys };
