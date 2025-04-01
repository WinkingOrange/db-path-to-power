// src/systems/DerivedStats.js

import { StatKeys } from './BaseStats.js';
import { ResourceKeys } from './Resources.js';

export class CharacterDerivedStats {
    constructor(attributes, baseStats, resources) {
        if (!attributes || !baseStats || !resources) {
            throw new Error("CharacterDerivedStats requires Attributes, BaseStats, and Resources instances.");
        }
        this.attributes = attributes;
        this.baseStats = baseStats;
        this.resources = resources;

        // --- Calculated Values ---
        this._basePL = 0;        // Power Level based purely on stats/potential
        this._effectivePL = 0;   // Power Level affected by current resources/fatigue/effects
        this._movementRange = 0; // How many units the character can move
        this._turnOrder = 0;     // Initiative value determining turn sequence

        this.updateAll(); // Calculate initial values
    }

    // --- Calculation Methods ---

    // Calculate Base Power Level (PL)
    // This represents the character's innate power based on stats, modified by potential.
    calculateBasePL() {
        const stats = this.baseStats;
        const potential = this.attributes.potential;

        // Weighted sum of base stats - Adjust weights as needed for balance
        const rawPL = (
            // HP, KI, STA currently don't directly contribute. Their influence is via other stats.
            stats.getStat(StatKeys.STR) * 1.8 + // Strength is a major component
            stats.getStat(StatKeys.VIT) * 0.5 + // Vitality adds some toughness/resilience contributing to PL
            stats.getStat(StatKeys.TEC) * 1.5 + // Technique is important for combat effectiveness
            stats.getStat(StatKeys.WIS) * 0.3 + // Wisdom has minor contribution
            stats.getStat(StatKeys.AURA) * 0.4 + // Aura contributes moderately
            stats.getStat(StatKeys.AGI) * 1.0   // Agility contributes
        );

        // Apply potential multiplier.
        // TODO: Revisit how Potential Cap works. Does potential simply multiply the raw calculation,
        // or does it set a ceiling based on a theoretical max PL? Current implementation is multiplication.
        // Memory states "Potential% caps Base PL", which implies a ceiling.
        // Example ceiling logic: theoreticalMaxPL = calculateMaxPossiblePL();
        // this._basePL = Math.min(Math.floor(rawPL), Math.floor(theoreticalMaxPL * potential));
        this._basePL = Math.floor(rawPL * potential); // Current simple multiplication approach

        console.log(`Calculated Base PL: ${this._basePL} (Raw: ${Math.floor(rawPL)}, Potential: ${potential * 100}%)`);
        return this._basePL;
    }

    // Calculate Effective Power Level
    // Modifies Base PL based on current resource percentages, fatigue, status effects, transformations.
    calculateEffectivePL() {
        const healthPercent = this.resources.maxHealth > 0 ? this.resources[ResourceKeys.HEALTH] / this.resources.maxHealth : 0;
        const kiPercent = this.resources.maxKi > 0 ? this.resources[ResourceKeys.KI] / this.resources.maxKi : 0;
        const staminaPercent = this.resources.maxStamina > 0 ? this.resources[ResourceKeys.STAMINA] / this.resources.maxStamina : 0;
        const fatigue = this.resources[ResourceKeys.FATIGUE]; // Assume 0-100 scale

        // Weights are examples, tune for balance.
        let modifier = 1.0;
        modifier *= (0.5 + healthPercent * 0.5);  // Health impact (50% base, scales up to 100%)
        modifier *= (0.8 + kiPercent * 0.2);      // Ki impact (80% base, scales up to 100%)
        modifier *= (0.7 + staminaPercent * 0.3); // Stamina impact (70% base, scales up to 100%)
        modifier *= (1.0 - (fatigue / 200));      // Fatigue reduction (100 fatigue = 0.5x modifier)

        // TODO: Incorporate status effects (buffs/debuffs) here.
        // TODO: Incorporate transformations here.

        this._effectivePL = Math.max(0, Math.floor(this._basePL * modifier)); // Ensure PL doesn't go below 0
        console.log(`Calculated Effective PL: ${this._effectivePL} (Base: ${this._basePL}, Modifier: ${modifier.toFixed(3)})`);
        return this._effectivePL;
    }

    // Calculate Movement Range (e.g., in grid units or pixels)
    calculateMovementRange() {
        const agi = this.baseStats.getStat(StatKeys.AGI);
        // Formula: Base range + AGI bonus. Tune base and divisor as needed.
        this._movementRange = Math.floor(3 + agi / 10);
        console.log(`Calculated Movement Range: ${this._movementRange}`);
        return this._movementRange;
    }

    // Calculate Turn Order value (Initiative)
    calculateTurnOrder() {
        const agi = this.baseStats.getStat(StatKeys.AGI);
        const tec = this.baseStats.getStat(StatKeys.TEC);
        // Formula: Primarily AGI, with a contribution from TEC.
        // TODO: Incorporate status effects (haste/slow) here.
        this._turnOrder = Math.floor(agi + tec * 0.5);
        console.log(`Calculated Turn Order: ${this._turnOrder} (AGI: ${agi}, TEC: ${tec})`);
        return this._turnOrder;
    }

    // --- Update & Getters ---

    /** Recalculates all derived stats. Should be called when underlying values change significantly. */
    updateAll() {
        console.log("Updating Derived Stats...");
        this.calculateBasePL();
        this.calculateEffectivePL(); // Initial calculation
        this.calculateMovementRange();
        this.calculateTurnOrder();
        // Add calls for any new derived stats here
        console.log("Derived Stats Updated.");
    }

    /** Gets the current Base Power Level. */
    get basePL() { return this._basePL; }

    /** Gets the current Effective Power Level. */
    get effectivePL() { return this._effectivePL; }

    /** Gets the current Movement Range. */
    get movementRange() { return this._movementRange; }

    /** Gets the current Turn Order value. */
    get turnOrder() { return this._turnOrder; }

    // --- Utility --- // Renamed from "Utility"

    /**
     * Updates derived stats based on changes in underlying base stats or attributes.
     * This recalculates everything as base stats/attributes can affect multiple derived stats.
     */
    handleStatChange() {
        console.log("DerivedStats detected stat/attribute change, updating all...");
        this.updateAll();
    }

    /**
     * Updates derived stats based specifically on changes in current resource levels.
     * Primarily recalculates stats sensitive to resource percentages, like Effective PL.
     */
    handleResourceChange() {
        console.log("DerivedStats detected resource change, updating Effective PL...");
        this.calculateEffectivePL(); // Only recalculate what's needed
        // If other derived stats depend on current resources, recalculate them here too.
    }
}
