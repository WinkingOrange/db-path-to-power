// src/systems/Attributes.js

import { CharacterBaseStats, StatKeys } from './BaseStats.js';

// Define constants for Races (can be expanded)
export const Race = Object.freeze({
    SAIYAN: 'Saiyan',
    HUMAN: 'Human',
    NAMEKIAN: 'Namekian',
    ANDROID: 'Android',
    FRIEZA_RACE: 'Frieza Race',
    MAJIN: 'Majin',
    // Add others as needed
});

// Define constants for Alignments
export const Alignment = Object.freeze({
    PURE_GOOD: 'Pure Good',
    GOOD: 'Good',
    NEUTRAL: 'Neutral',
    EVIL: 'Evil',
    PURE_EVIL: 'Pure Evil',
});

// Base class or structure for character attributes
export class CharacterAttributes {
    constructor({
        level = 1,
        xp = 0,
        xpToNextLevel = 100, // Example starting value
        race = Race.HUMAN,
        potential = 0.1, // Representing 10%
        alignment = Alignment.NEUTRAL,
        unallocatedStatPoints = 0, // RENAMED from statPoints
        skillPoints = 0,
        potentialCap = potential, // Max potential achievable
        baseStats = null // Added parameter to link stats
    } = {}) {
        this.level = level;
        this.xp = xp;
        this.xpToNextLevel = xpToNextLevel; // Logic for scaling this will be needed
        this.race = race;
        this.potential = potential; // Current potential unlocked
        this.potentialCap = potentialCap; // The character's absolute max potential ceiling
        this.alignment = alignment; // This might be hidden from player UI
        this.unallocatedStatPoints = unallocatedStatPoints; // RENAMED from statPoints
        this.skillPoints = skillPoints; // Points available for skills
        this.baseStats = baseStats; // Store the reference

        // Basic validation
        if (!Object.values(Race).includes(this.race)) {
            console.warn(`Invalid Race provided: ${this.race}. Defaulting to HUMAN.`);
            this.race = Race.HUMAN;
        }
        if (!Object.values(Alignment).includes(this.alignment)) {
            console.warn(`Invalid Alignment provided: ${this.alignment}. Defaulting to NEUTRAL.`);
            this.alignment = Alignment.NEUTRAL;
        }
    }

    // --- Methods to be added later ---

    // Method to add XP and handle Level Up
    addXP(amount) {
        this.xp += amount;
        console.log(`Gained ${amount} XP. Total XP: ${this.xp}/${this.xpToNextLevel}`);
        // Basic Level Up Check (more sophisticated logic needed)
        while (this.xp >= this.xpToNextLevel) {
            this.xp -= this.xpToNextLevel;
            this.levelUp();
        }
    }

    // Method to handle Level Up logic
    levelUp() {
        this.level++;
        const newStatPoints = 5; // Example points gained per level
        const newSkillPoints = 1; // Example points gained per level
        this.unallocatedStatPoints += newStatPoints;
        this.skillPoints += newSkillPoints;

        // Update XP required for the next level (e.g., simple scaling)
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.2);

        console.log(`LEVEL UP! Reached Level ${this.level}.`);
        console.log(`Gained ${newStatPoints} Stat Points (Total: ${this.unallocatedStatPoints})`);
        console.log(`Gained ${newSkillPoints} Skill Points (Total: ${this.skillPoints})`);
        console.log(`Next level at ${this.xpToNextLevel} XP.`);

        // Potential trigger for recalculating stats/PL could go here
    }

    // Method to allocate Stat Points (needs BaseStats system interaction)
    allocateStatPoint(statKey) {
        // Check if stat points are available
        if (this.unallocatedStatPoints <= 0) {
            console.warn("No unallocated Stat Points available to allocate.");
            return false; // Indicate failure
        }
        // Check if baseStats object is linked
        if (!this.baseStats) {
            console.error("BaseStats object not linked to Attributes. Cannot allocate point.");
            return false;
        }
        // Check if the provided key is a valid stat key
        if (!Object.values(StatKeys).includes(statKey)) {
            console.warn(`Cannot allocate point to invalid stat key: ${statKey}`);
            return false;
        }

        // Attempt to increase the stat in the linked BaseStats object
        const success = this.baseStats.increaseStat(statKey, 1);

        // If the stat was successfully increased, decrement the available points
        if (success) {
            this.unallocatedStatPoints--;
            console.log(`Successfully allocated 1 point to ${statKey.toUpperCase()}. Unallocated Stat Points remaining: ${this.unallocatedStatPoints}`);
            // Optionally trigger recalculations if needed immediately after allocation
            // this.baseStats.recalculateDerivedStats();
            return true;
        } else {
            // increaseStat should have logged the reason for failure
            console.error(`Failed to increase stat ${statKey}. Stat point not spent.`);
            return false;
        }
    }

    // Method to unlock/upgrade skills (needs Skill system interaction)
    useSkillPoint(skillId) {
        if (this.skillPoints > 0) {
            // Logic to unlock or upgrade the target skill
            // This requires reference to the Skill system/character's skill list
            console.log(`Using skill point for ${skillId}... (Requires Skill system integration)`);
            // Assume success for now
            this.skillPoints--;
            console.log(`Skill Points remaining: ${this.skillPoints}`);
            return true; // Indicate success
        } else {
            console.warn("No Skill Points available.");
            return false; // Indicate failure
        }
    }

    // Method to potentially increase potential (rare events)
    increasePotential(amount) {
        this.potential = Math.min(this.potential + amount, this.potentialCap);
        console.log(`Potential increased by ${amount*100}%. Current Potential: ${this.potential * 100}% / ${this.potentialCap * 100}%`);
        // This should trigger recalculation of max Base PL
    }
}

// Example Usage (for testing purposes, remove later)
/*
const playerBaseStats = new CharacterBaseStats({ str: 12, agi: 15 });
const playerAttributes = new CharacterAttributes({
    race: Race.SAIYAN,
    potential: 0.15,
    potentialCap: 1.0,
    baseStats: playerBaseStats // Link the stats object
});

console.log("Initial State:", playerAttributes, playerBaseStats);
playerAttributes.addXP(150); // Level up, gain points
console.log("After XP:", playerAttributes, playerBaseStats);

playerAttributes.allocateStatPoint(StatKeys.STR); // Use a point on STR
playerAttributes.allocateStatPoint(StatKeys.VIT); // Use a point on VIT
playerAttributes.allocateStatPoint('invalid');   // Try invalid
playerAttributes.allocateStatPoint(StatKeys.AGI);
playerAttributes.allocateStatPoint(StatKeys.AGI);
playerAttributes.allocateStatPoint(StatKeys.AGI);
playerAttributes.allocateStatPoint(StatKeys.AGI); // Should fail (no points left)

console.log("Final State:", playerAttributes, playerBaseStats);

playerAttributes.increasePotential(0.05);
*/
