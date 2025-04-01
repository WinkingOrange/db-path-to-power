// src/main.js

// A simple placeholder scene
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Preload assets if needed later
        console.log("BootScene preload");
    }

    create() {
        console.log("BootScene create");
        // Add some basic text to confirm the scene is running
        this.add.text(100, 100, 'Dragon Ball: Path to Power\nLoading...', { fill: '#0f0' });

        // Optionally, transition to the next scene (e.g., MainMenuScene)
        // this.scene.start('MainMenuScene');
    }
}

// Phaser Game Configuration
const config = {
    type: Phaser.AUTO, // Automatically choose WebGL or Canvas
    parent: 'game-container', // ID of the div to contain the game canvas
    width: 800,
    height: 600,
    backgroundColor: '#1b1464', // A dark blue background, reminiscent of space/night sky
    scene: [BootScene] // Start with the BootScene
    // Add physics configuration later if needed
    // physics: {
    //     default: 'arcade',
    //     arcade: {
    //         gravity: { y: 0 },
    //         debug: false // Set to true for debugging physics bodies
    //     }
    // }
};

// Initialize the Phaser Game instance
const game = new Phaser.Game(config);
