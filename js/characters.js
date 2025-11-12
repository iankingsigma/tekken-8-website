// Character Data
const CHARACTERS = [
    {
        id: 67,
        name: "67",
        style: "Meme Style",
        hp: 1200,
        color: "#ffcc00",
        icon: "67",
        description: "Legendary meme fighter with unpredictable moves and devastating combos. Harnesses the power of the golden number.",
        moves: {
            punch: 40,
            kick: 35,
            special: 80
        },
        combos: [
            { input: ["right", "right", "punch"], name: "DRAGON UPPERCUT", damage: 120 },
            { input: ["down", "right", "punch"], name: "FIREBALL", damage: 100 },
            { input: ["punch", "punch"], name: "DOUBLE PUNCH", damage: 90 },
            { input: ["punch", "right", "punch", "kick"], name: "GOLDEN COMBO", damage: 200 }
        ]
    },
    {
        id: 41,
        name: "41",
        style: "Defense",
        hp: 1500,
        color: "#c80018",
        icon: "41",
        description: "A strong, heavy puncher with solid defense.",
        moves: {
            punch: 55,
            kick: 35,
            special: 70
        },
        combos: [
            { input: ["kick", "punch"], name: "GUARD BREAKER", damage: 110 },
            { input: ["down", "kick", "punch"], name: "EARTH SHATTER", damage: 135 }
        ]
    },
    {
        id: 21,
        name: "21",
        style: "Balanced",
        hp: 1100,
        color: "#58a11d",
        icon: "21",
        description: "Swift and fast, excels at quick combos and dodges.",
        moves: {
            punch: 44,
            kick: 41,
            special: 66
        },
        combos: [
            { input: ["left", "right", "kick"], name: "FLASH COMBO", damage: 99 }
        ]
    },
    {
        id: 201,
        name: "201",
        style: "Tank",
        hp: 1390,
        color: "#841dae",
        icon: "201",
        description: "Tank-like endurance. Slower but can take a beating.",
        moves: {
            punch: 14,
            kick: 18,
            special: 26
        },
        combos: [
            { input: ["down", "kick", "kick"], name: "HEAVY SLAM", damage: 80 }
        ]
    },
    // Special Brainrotter Tab
    {
        id: 501,
        name: "Tung tung tung sahur",
        style: "aahil",
        hp: 999,
        color: "#4fc3f7",
        icon: "🥁",
        description: "Tung tung tung sahur (aahil) brings the dawn.",
        moves: {
            punch: 30,
            kick: 25,
            special: 99
        },
        combos: [
            { input: ["left", "right", "special"], name: "Sahur Smash", damage: 111 }
        ]
    },
    {
        id: 502,
        name: "JOB ",
        style: "job job job sahur",
        hp: 888,
        color: "#81c784",
        icon: "💼",
        description: "Ziad keeps hustling. Job job job sahur!",
        moves: {
            punch: 20,
            kick: 35,
            special: 88
        },
        combos: [
            { input: ["kick", "kick", "special"], name: "Job Blast", damage: 99 }
        ]
    },
    {
        id: 503,
        name: "TATATA SAHURR",
        style: "ta ta ta sahur",
        hp: 1111,
        color: "#f06292",
        icon: "🎶",
        description: "Ian's ta ta ta sahur wakes up the squad.",
        moves: {
            punch: 45,
            kick: 15,
            special: 101
        },
        combos: [
            { input: ["punch", "special", "special"], name: "Ta Ta Combo", damage: 130 }
        ]
    }
];
