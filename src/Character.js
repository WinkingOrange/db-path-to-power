// Import all the necessary system classes
import { CharacterAttributes, Race } from './systems/Attributes.js';
import { CharacterBaseStats, StatKeys } from './systems/BaseStats.js';
import { CharacterResources, ResourceKeys } from './systems/Resources.js';
import { CharacterDerivedStats } from './systems/DerivedStats.js';
import { CharacterCombatStats } from './systems/CombatStats.js';
import { CharacterResistances, ResistanceKeys } from './systems/Resistances.js';

/**
 * Represents a complete character, integrating all underlying systems.
 */
class Character {
    /**
     * Creates a new Character instance.
     * @param {object} config - Configuration object for the character.
     * @param {object} [config.attributesConfig={}] - Initial configuration for CharacterAttributes.
     * @param {object} [config.baseStatsConfig={}] - Initial configuration for CharacterBaseStats.
     * @param {string} [config.name='Character'] - The character's name.
     */
    constructor({ attributesConfig = {}, baseStatsConfig = {}, name = 'Character' } = {}) {
        this.name = name;
        console.log(`Initializing character: ${this.name}`);

        // --- Instantiate Core Systems ---

        // 1. Base Stats: Needs initial values, but otherwise independent initially.
        this._baseStats = new CharacterBaseStats(baseStatsConfig);

        // 2. Attributes: Needs initial values and a reference to BaseStats for stat allocation.
        this._attributes = new CharacterAttributes({ ...attributesConfig, baseStats: this._baseStats });

        // --- Instantiate Dependent Systems ---
        // These systems often depend on Attributes and BaseStats being available.

        // 3. Resources: Depends on Attributes (for level scaling?) and BaseStats (for base HP/KI/STA).
        this._resources = new CharacterResources(this._attributes, this._baseStats);

        // 4. Derived Stats: Depends on Attributes, BaseStats, and Resources.
        this._derivedStats = new CharacterDerivedStats(this._attributes, this._baseStats, this._resources);

        // 5. Combat Stats: Depends on Attributes and BaseStats. May optionally use DerivedStats.
        this._combatStats = new CharacterCombatStats(this._attributes, this._baseStats, this._derivedStats);

        // 6. Resistances: Depends on Attributes and BaseStats.
        this._resistances = new CharacterResistances(this._attributes, this._baseStats);

        // --- Link Systems for Updates (if necessary) ---
        // Example: If BaseStats change, other systems might need updating.
        // This could be handled via direct calls or an event system later.
        // For now, the `handleStatChange` methods exist in the subsystems.
        // We need a mechanism to trigger them when a base stat or attribute changes.

        console.log(`${this.name} initialized successfully.`);
    }

    // --- Accessors for Systems ---

    /** @returns {CharacterAttributes} The character's attributes instance. */
    get attributes() { return this._attributes; }

    /** @returns {CharacterBaseStats} The character's base stats instance. */
    get baseStats() { return this._baseStats; }

    /** @returns {CharacterResources} The character's resources instance. */
    get resources() { return this._resources; }

    /** @returns {CharacterDerivedStats} The character's derived stats instance. */
    get derivedStats() { return this._derivedStats; }

    /** @returns {CharacterCombatStats} The character's combat stats instance. */
    get combatStats() { return this._combatStats; }

    /** @returns {CharacterResistances} The character's resistances instance. */
    get resistances() { return this._resistances; }

    // --- High-Level Character Methods (Examples) ---

    /**
     * Handles the character leveling up.
     * This would involve updating attributes, potentially base stats (if auto-increase),
     * and triggering updates in dependent systems.
     */
    levelUp() {
        console.log(`${this.name} is leveling up!`);
        // 1. Update attributes (XP, level, stat points etc.)
        // this.attributes.gainXP(...); // This logic is more complex

        // For simplicity, let's assume level up gives stat points and maybe updates stats slightly.
        this.attributes.level++;
        this.attributes.unallocatedStatPoints += 5; // Example

        // 2. Recalculate dependent systems that rely on level or stats
        this.resources.handleStatChange(); // Max values might depend on level implicitly via base stats
        this.derivedStats.handleStatChange(); // PL, etc., depend on stats/level
        this.combatStats.handleStatChange(); // Might depend on level or stats
        this.resistances.handleStatChange(); // Might depend on stats

        console.log(`${this.name} reached Level ${this.attributes.level}. Stat Points: ${this.attributes.unallocatedStatPoints}`);
    }

    /**
     * Allocates a stat point using the Attributes system, which triggers BaseStats update.
     * @param {string} statKey - The key of the stat to increase (from StatKeys).
     */
    allocateStatPoint(statKey) {
        if (this.attributes.unallocatedStatPoints > 0) {
            const success = this.attributes.allocateStatPoint(statKey);
            if (success) {
                console.log(`${this.name} allocated point to ${statKey}. Remaining: ${this.attributes.unallocatedStatPoints}`);
                // The allocateStatPoint in Attributes should call increaseStat in BaseStats.
                // Now, trigger updates in systems dependent on BaseStats.
                this.resources.handleStatChange();
                this.derivedStats.handleStatChange();
                this.combatStats.handleStatChange();
                this.resistances.handleStatChange();
            }
        } else {
            console.warn(`${this.name} has no unallocated stat points.`);
        }
    }

    /**
     * Applies damage to the character's health.
     * @param {number} amount - The amount of damage to apply.
     * @param {string} type - The type of damage (e.g., ResistanceKeys.PHYSICAL, ResistanceKeys.ENERGY).
     */
    takeDamage(amount, type = ResistanceKeys.PHYSICAL) {
        // 1. Calculate resistance mitigation
        const resistanceValue = this.resistances.getResistance(type);
        const mitigatedAmount = Math.max(0, Math.round(amount * (1 - resistanceValue))); // Ensure damage isn't negative

        console.log(`${this.name} taking ${amount} ${type} damage. Resistance: ${(resistanceValue * 100).toFixed(1)}%. Mitigated Damage: ${mitigatedAmount}`);

        // Apply the damage using the Resources system method
        this.resources.takeDamage(mitigatedAmount); // Use the specific takeDamage method

        // Check if character is defeated
        if (this.resources.health <= 0) {
            console.log(`${this.name} has been defeated!`);
            // Handle defeat state
        }
    }

    // Add more methods as needed (e.g., useSkill, applyStatusEffect, equipItem, etc.)
}

// Export the main Character class
export { Character };

// Also re-export system keys for convenience if needed elsewhere
export * from './systems/BaseStats.js'; // Exports StatKeys
export * from './systems/Resources.js'; // Exports ResourceKeys
export * from './systems/Resistances.js'; // Exports ResistanceKeys
