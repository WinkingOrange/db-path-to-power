// src/test/character.test.js
import { Character } from '../Character.js';
import { StatKeys } from '../systems/BaseStats.js';
import { ResistanceKeys } from '../systems/Resistances.js';

// Helper function to create a character with specific base stats for testing
const createTestCharacter = (stats) => {
    return new Character({
        name: 'TestCharacter',
        baseStatsConfig: {  
            hp: stats.hp || 100,
            ki: stats.ki || 100,
            sta: stats.sta || 100,
            str: stats.str || 10,
            vit: stats.vit || 10,
            tec: stats.tec || 10,
            wis: stats.wis || 10,
            aura: stats.aura || 10,
            agi: stats.agi || 10,
        }
    });
};

describe('Character System Integration Tests', () => {

    describe('CharacterCombatStats Calculations (Diminishing Returns)', () => {
        it('should calculate Accuracy correctly', () => {
            const stats = { tec: 50, agi: 30 };
            const character = createTestCharacter(stats);
            const tec = stats.tec;
            const agi = stats.agi;
            const expected = 50 + (tec / (tec + 60)) * 50 + (agi / (agi + 120)) * 25;
            expect(character.combatStats.accuracy).toBeCloseTo(expected, 1);
        });

        it('should calculate Evasion correctly', () => {
            const stats = { agi: 80, aura: 50 };
            const character = createTestCharacter(stats);
            const agi = stats.agi;
            const aura = stats.aura;
            const expected = 35 + (agi / (agi + 80)) * 60 + (aura / (aura + 150)) * 20;
            expect(character.combatStats.evasion).toBeCloseTo(expected, 1);
        });

        it('should calculate Crit Chance correctly with normal values', () => {
            const stats = { tec: 100 };
            const character = createTestCharacter(stats);
            const tec = stats.tec;
            const expected = 0.05 + (tec / 150); // Base 5% + TEC contribution
            expect(character.combatStats.critChance).toBeCloseTo(expected, 3);
        });
        
        it('should allow crit chance to exceed 100%', () => {
            const highStats = { tec: 300 };
            const character = createTestCharacter(highStats);
            const tec = highStats.tec;
            const expected = 0.05 + (tec / 150); // Base 5% + TEC contribution
            expect(character.combatStats.critChance).toBeCloseTo(expected, 3);
            expect(character.combatStats.critChance).toBeGreaterThan(1.0); // Should exceed 100%
            expect(character.combatStats.effectiveCritChance).toBe(1.0); // Effective crit chance is capped at 100%
        });

        it('should calculate tiered critical hit thresholds correctly', () => {
            const stats = { tec: 300 };
            const character = createTestCharacter(stats);
            const critChance = character.combatStats.critChance;
            
            // Check tier threshold values
            expect(character.combatStats.critTiers.regular.threshold).toBe(1);
            expect(character.combatStats.critTiers.super.threshold).toBe(1.01);
            expect(character.combatStats.critTiers.mega.threshold).toBe(2.01);
            expect(character.combatStats.critTiers.omega.threshold).toBe(3.01);
            
            // Check can land different critical hit tiers
            expect(character.combatStats.canSuperCrit).toBe(critChance >= 1.01);
            expect(character.combatStats.canMegaCrit).toBe(critChance >= 2.01);
            expect(character.combatStats.canOmegaCrit).toBe(critChance >= 3.01);
        });
        
        it('should calculate tier chance percentages correctly', () => {
            const highTecStats = { tec: 475 }; // This should result in a crit chance > 3.0
            const character = createTestCharacter(highTecStats);
            
            // Verify all tier chances
            expect(character.combatStats.critChance).toBeGreaterThan(3.0);
            
            // Super tier chance (should be 100% at this crit level)
            expect(character.combatStats.superCritChance).toBe(1.0);
            
            // Mega tier chance (should be 100% at this crit level)
            expect(character.combatStats.megaCritChance).toBe(1.0);
            
            // Omega tier chance (should be the excess over 3.01)
            const omegaExpected = Math.min(character.combatStats.critChance - 3.01 + 0.01, 1.0);
            expect(character.combatStats.omegaCritChance).toBeCloseTo(omegaExpected, 4);
        });
        
        it('should calculate tiered critical hit damage multipliers correctly for physical damage', () => {
            const stats = { str: 150 };
            const character = createTestCharacter(stats);
            const baseCritDamage = character.combatStats.critDamage;
            
            // Test the multipliers for each tier
            expect(character.combatStats.getCritMultiplier('normal', 'physical')).toBeCloseTo(1.0, 3);
            expect(character.combatStats.getCritMultiplier('regular', 'physical')).toBeCloseTo(baseCritDamage, 3);
            expect(character.combatStats.getCritMultiplier('super', 'physical')).toBeCloseTo(baseCritDamage, 3);
            expect(character.combatStats.getCritMultiplier('mega', 'physical')).toBeCloseTo(baseCritDamage * 1.5, 3);
            expect(character.combatStats.getCritMultiplier('omega', 'physical')).toBeCloseTo(baseCritDamage * 2.0, 3);
        });
        
        it('should calculate tiered critical hit damage multipliers correctly for energy damage', () => {
            const stats = { tec: 150 };
            const character = createTestCharacter(stats);
            const baseEnergyCritDamage = character.combatStats.energyCritDamage;
            
            // Test the multipliers for each tier with energy damage
            expect(character.combatStats.getCritMultiplier('normal', 'energy')).toBeCloseTo(1.0, 3);
            expect(character.combatStats.getCritMultiplier('regular', 'energy')).toBeCloseTo(baseEnergyCritDamage, 3);
            expect(character.combatStats.getCritMultiplier('super', 'energy')).toBeCloseTo(baseEnergyCritDamage, 3);
            expect(character.combatStats.getCritMultiplier('mega', 'energy')).toBeCloseTo(baseEnergyCritDamage * 1.5, 3);
            expect(character.combatStats.getCritMultiplier('omega', 'energy')).toBeCloseTo(baseEnergyCritDamage * 2.0, 3);
        });
        
        it('should handle unknown critical hit tiers gracefully', () => {
            const character = createTestCharacter({});
            // Should return default multiplier (1.0) for unknown tiers
            expect(character.combatStats.getCritMultiplier('unknown', 'physical')).toBe(1.0);
            // Should return 0 defense ignore for unknown tiers
            expect(character.combatStats.getCritDefenseIgnore('unknown')).toBe(0);
            // Should return false for knockback with unknown tiers
            expect(character.combatStats.getCritKnockback('unknown')).toBe(false);
        });
        
        it('should correctly apply defense ignore values for critical hit tiers', () => {
            const character = createTestCharacter({});
            
            // Check defense ignore values
            expect(character.combatStats.getCritDefenseIgnore('normal')).toBe(0);
            expect(character.combatStats.getCritDefenseIgnore('regular')).toBe(0);
            expect(character.combatStats.getCritDefenseIgnore('super')).toBe(0.25);
            expect(character.combatStats.getCritDefenseIgnore('mega')).toBe(0.25);
            expect(character.combatStats.getCritDefenseIgnore('omega')).toBe(0.50);
        });
        
        it('should correctly handle guaranteed knockback for omega critical hits', () => {
            const character = createTestCharacter({});
            
            // Only OMEGA crits should guarantee knockback
            expect(character.combatStats.getCritKnockback('normal')).toBe(false);
            expect(character.combatStats.getCritKnockback('regular')).toBe(false);
            expect(character.combatStats.getCritKnockback('super')).toBe(false);
            expect(character.combatStats.getCritKnockback('mega')).toBe(false);
            expect(character.combatStats.getCritKnockback('omega')).toBe(true);
        });

        it('should calculate Physical Crit Damage correctly', () => {
            const stats = { str: 100 };
            const character = createTestCharacter(stats);
            const str = stats.str;
            const expected = 1.5 + (str / (str + 200)) * 3.5;
            expect(character.combatStats.critDamage).toBeCloseTo(expected, 2);
        });

        it('should calculate Energy Crit Damage correctly', () => {
            const stats = { tec: 120 };
            const character = createTestCharacter(stats);
            const tec = stats.tec;
            const expected = 1.5 + (tec / (tec + 200)) * 3.5;
            expect(character.combatStats.energyCritDamage).toBeCloseTo(expected, 2);
        });

        it('should calculate Knockback correctly', () => {
            const stats = { str: 75 };
            const character = createTestCharacter(stats);
            const str = stats.str;
            const expected = Math.floor(3 + (str / (str + 50)) * 12);
            expect(character.combatStats.knockback).toEqual(expected); // Integer comparison
        });

        it('should calculate Pursuit correctly', () => {
            const stats = { agi: 90, tec: 60 };
            const character = createTestCharacter(stats);
            const agi = stats.agi;
            const tec = stats.tec;
            const expected = Math.floor(5 + (agi / (agi + 75)) * 30 + (tec / (tec + 150)) * 15);
            expect(character.combatStats.pursuit).toEqual(expected); // Integer comparison
        });
    });

    describe('CharacterResistances Calculations (Diminishing Returns)', () => {
        it('should calculate Physical Resistance correctly', () => {
            const stats = { vit: 100 };
            const character = createTestCharacter(stats);
            const vit = stats.vit;
            // Matches implementation in Resistances.js
            const expected = Math.min((vit / (vit + 100)) * 0.90, 0.90);
            expect(character.resistances.physical).toBeCloseTo(expected, 3);
        });

         it('should calculate Energy Resistance correctly', () => {
            const stats = { aura: 120 };
            const character = createTestCharacter(stats);
            const aura = stats.aura;
            // Matches implementation in Resistances.js
            const expected = Math.min((aura / (aura + 100)) * 0.90, 0.90);
            expect(character.resistances.energy).toBeCloseTo(expected, 3);
        });

        it('should calculate Status Resistance correctly', () => {
            const stats = { vit: 60, wis: 90, aura: 30 };
            const character = createTestCharacter(stats);
            const vit = stats.vit;
            const wis = stats.wis;
            const aura = stats.aura;
            
            // Matches implementation in Resistances.js
            const vitContribution = (vit / (vit + 120)) * 0.40;
            const wisContribution = (wis / (wis + 120)) * 0.30;
            const auraContribution = (aura / (aura + 120)) * 0.15;
            const expected = Math.min(vitContribution + wisContribution + auraContribution, 0.85);
            
            expect(character.resistances.status).toBeCloseTo(expected, 3);
        });

         it('should ensure resistances are capped appropriately', () => {
            // Create a character with very high stats to test caps
            const highStats = { vit: 10000, wis: 10000, aura: 10000 };
            const character = createTestCharacter(highStats);
            
            // Check that resistances don't exceed their caps
            expect(character.resistances.physical).toBeLessThanOrEqual(0.90);
            expect(character.resistances.energy).toBeLessThanOrEqual(0.90);
            expect(character.resistances.status).toBeLessThanOrEqual(0.85);
        });
    });

    describe('Character Method Tests', () => {
        it('should apply mitigated damage correctly based on resistance', () => {
            const stats = { vit: 100, str: 50 }; // Matches Phys Res test, expected ~0.339
            const character = createTestCharacter(stats);
            const initialHealth = character.resources.health;
            const damageAmount = 50;
            const resistance = character.resistances.physical; // Expected ~0.339
            const expectedDamageTaken = Math.max(0, Math.round(damageAmount * (1 - resistance)));

            character.takeDamage(damageAmount, ResistanceKeys.PHYSICAL);

            expect(character.resources.health).toEqual(initialHealth - expectedDamageTaken);
        });
    });

}); // End Main Describe Block
