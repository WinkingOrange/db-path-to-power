// src/systems/BaseStats.js

// Define keys for stats for easier reference and validation
export const StatKeys = Object.freeze({
    HP: 'hp',       // Max Health stat (influences resource)
    KI: 'ki',       // Max Ki stat (influences resource)
    STA: 'sta',     // Max Stamina stat (influences resource)
    STR: 'str',     // Strength (Physical Attack)
    VIT: 'vit',     // Vitality (Physical Defense, HP/Stamina influence)
    TEC: 'tec',     // Technique (Energy Attack)
    WIS: 'wis',     // Wisdom (Ki Control, Max Ki influence)
    AURA: 'aura',   // Aura (Energy Defense, Max Ki influence)
    AGI: 'agi'      // Agility (Speed, Evasion, Stamina influence)
});

export class CharacterBaseStats {
    constructor({
        hp = 100,
        ki = 50,
        sta = 75,
        str = 10,
        vit = 10,
        tec = 10,
        wis = 10,
        aura = 10,
        agi = 10,
        // Potentially link to Attributes to consider level/potential later
        // attributes = null
    } = {}) {
        this[StatKeys.HP] = hp;
        this[StatKeys.KI] = ki;
        this[StatKeys.STA] = sta;
        this[StatKeys.STR] = str;
        this[StatKeys.VIT] = vit;
        this[StatKeys.TEC] = tec;
        this[StatKeys.WIS] = wis;
        this[StatKeys.AURA] = aura;
        this[StatKeys.AGI] = agi;

        // this.attributes = attributes; // Store reference if needed for complex calcs
    }

    // Get the value of a specific stat
    getStat(statKey) {
        if (this.hasOwnProperty(statKey)) {
            return this[statKey];
        } else {
            console.warn(`Invalid stat key requested: ${statKey}`);
            return 0;
        }
    }

    // Increase a specific stat by a given amount (e.g., from Stat Point allocation)
    increaseStat(statKey, amount = 1) {
        if (!Object.values(StatKeys).includes(statKey)) {
             console.warn(`Cannot increase invalid stat key: ${statKey}`);
             return false;
        }
        if (amount <= 0) {
            console.warn(`Amount to increase stat must be positive: ${amount}`);
            return false;
        }

        this[statKey] += amount;
        console.log(`Increased ${statKey.toUpperCase()} by ${amount}. New value: ${this[statKey]}`);

        // Trigger recalculation of derived values (Max HP/Ki/Stamina, Base PL) if needed
        // this.recalculateDerivedStats(); // Placeholder for future method

        return true;
    }

    // Placeholder for recalculating stats potentially influenced by multiple base stats
    // (e.g., Max HP influenced by Level and VIT)
    recalculateDerivedStats() {
        console.log("Recalculating derived stats... (Requires Resource system integration)");
        // Example: this.maxHp = calculateMaxHp(this.attributes.level, this.vit);
        // Example: this.maxKi = calculateMaxKi(this.attributes.level, this.wis, this.aura);
        // Example: this.maxStamina = calculateMaxStamina(this.attributes.level, this.vit, this.agi);
        // Example: this.basePL = calculateBasePL(this);
    }

    // Set all stats based on a provided stats object (e.g., loading from data)
    setStats(statsObject) {
         for (const key in statsObject) {
            if (Object.values(StatKeys).includes(key)) {
                if (typeof statsObject[key] === 'number' && statsObject[key] >= 0) {
                    this[key] = statsObject[key];
                } else {
                     console.warn(`Invalid value provided for stat ${key}: ${statsObject[key]}. Skipping.`);
                }
            }
         }
         console.log("Stats updated from object.");
         // this.recalculateDerivedStats(); // Recalculate after setting
    }

    /**
     * Returns an object containing all current base stats.
     * @returns {object} An object with stat keys and their current values.
     */
    getAllStats() {
        const allStats = {};
        for (const key in StatKeys) {
            const statEnumKey = StatKeys[key]; // e.g., "HP", "KI"
            allStats[statEnumKey] = this[statEnumKey];
        }
        return allStats;
    }

}

// Example Usage (for testing, remove later)
/*
const playerStats = new CharacterBaseStats({ str: 12, agi: 15 });
console.log(playerStats);
console.log(`Current STR: ${playerStats.getStat(StatKeys.STR)}`);
playerStats.increaseStat(StatKeys.STR, 3);
playerStats.increaseStat(StatKeys.AGI, 1);
playerStats.increaseStat('invalidStat'); // Test invalid key
playerStats.setStats({ hp: 150, tec: 20, str: 18 });
console.log(playerStats);
console.log(playerStats.getAllStats());
*/
