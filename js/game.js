// Brainrot Fighters v5.0 - Complete Game Logic with ALL Mechanics

// Game State
let gameState = {
    currentScreen: 'deviceDetection',
    selectedCharacter: null,
    player: null,
    cpu: null,
    keys: {},
    combo: [],
    lastKeyTime: 0,
    gameActive: false,
    roundTime: 99,
    roundTimerInterval: null,
    comboCount: 0,
    score: 0,
    coins: parseInt(localStorage.getItem('brainrotCoins')) || 1000,
    highScore: localStorage.getItem('brainrotHighScore') || 0,
    deviceType: 'desktop',
    gameMode: 'arcade',
    difficulty: 'medium',
    cpuMemory: JSON.parse(localStorage.getItem('cpuMemory')) || {},
    playerInventory: JSON.parse(localStorage.getItem('playerInventory')) || {},
    healCooldownActive: false,
    healCooldownEnd: 0,
    bossUnlocked: localStorage.getItem('boss67Unlocked') === 'true',
    boss21Unlocked: localStorage.getItem('boss21Unlocked') === 'true',
    isBossFight: false,
    is21BossFight: false,
    cutsceneActive: false,
    customBackground: localStorage.getItem('customBackground') || 'default',
    
    // Dodge system
    dodgeWindow: false,
    dodgeWarningActive: false,
    dodgeSuccessful: false,
    nextAttackTime: 0,
    
    // Turn-based system (21 Boss)
    turnBased: false,
    playerTurn: true,
    charges: 0,
    timingBarActive: false,
    timingBarProgress: 0,
    timingBarSpeed: 0.015,
    timingBarDirection: 1,
    targetZoneStart: 0.4,
    targetZoneEnd: 0.6,
    holdingSpace: false,
    spacePressed: false,
    bossCharges: 0,
    bossNextAction: null
};

// Extended Boss Cutscene Texts (20 seconds)
const BOSS_67_CUTSCENE = [
    "THE LEGEND OF 67...",
    "A FORCE BEYOND COMPREHENSION...",
    "IT CORRUPTS EVERYTHING IT TOUCHES...",
    "THE BRAINROT SPREADS...",
    "YOU CANNOT DEFEAT IT...",
    "YOU CAN ONLY SURVIVE...",
    "BUT EVEN IN DARKNESS...",
    "THERE IS HOPE...",
    "A SECOND CHANCE AWAITS...",
    "WHEN ALL SEEMS LOST...",
    "THE LEGEND WILL PROTECT YOU...",
    "THE LEGEND OF THE BLOODROT...",
    "PREPARE YOURSELF...",
    "FOR THE ULTIMATE CHALLENGE...",
    "67 RISES..."
];

// 21 Boss Short Cutscene (4 seconds)
const BOSS_21_CUTSCENE = [
    "THE TURN-BASED MASTER...",
    "21 CHALLENGES YOU...",
    "STRATEGIC COMBAT BEGINS..."
];

// Initialize game
function init() {
    console.log('Initializing Brainrot Fighters v5.0...');
    document.getElementById('highScore').textContent = gameState.highScore || 0;
    document.getElementById('coinsAmount').textContent = gameState.coins || 0;
    detectDevice();
    setupEventListeners();
    renderCharacterSelect();
    applyCustomBackground();
    checkBossUnlock();
    
    // Ensure canvas has focus for keyboard input
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.setAttribute('tabindex', '0');
        canvas.style.outline = 'none';
    }
    
    if (typeof loadShopItems === 'function') {
        setTimeout(loadShopItems, 100);
    }
    
    // Try to play menu music
    try {
        const menuMusic = document.getElementById('menuMusic');
        if (menuMusic) {
            menuMusic.volume = 0.3;
            menuMusic.play().catch(e => console.log("Menu music autoplay blocked, will play on user interaction"));
        }
    } catch (e) {
        console.log("Menu music error:", e);
    }
}

// Auto Device Detection
function detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isTablet = /tablet|ipad|playbook|silk|kindle|(android(?!.*mobile))/.test(userAgent);
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTablet || (hasTouch && window.innerWidth >= 768)) {
        gameState.deviceType = 'tablet';
    } else {
        gameState.deviceType = 'desktop';
    }
    
    const deviceTypeElement = document.getElementById('deviceType');
    if (deviceTypeElement) {
        deviceTypeElement.textContent = 
            gameState.deviceType === 'tablet' ? 'TABLET MODE DETECTED' : 'PC MODE DETECTED';
    }
    
    // Auto-proceed to loading after 2 seconds
    setTimeout(() => {
        simulateLoading();
    }, 2000);
}

function simulateLoading() {
    showScreen('loading');
    let progress = 0;
    const loadingBar = document.getElementById('loadingBar');
    const loadingText = document.getElementById('loadingText');
    const stages = [
        "INITIALIZING BRAINROT ENGINE...",
        "LOADING BRAINROTTERS...",
        "SETTING UP TURN-BASED SYSTEM...",
        "CALIBRATING DODGE MECHANICS...",
        "READY TO BRAINROT!"
    ];
    
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                showScreen('mainMenu');
            }, 500);
        }
        
        if (loadingBar) loadingBar.style.width = `${progress}%`;
        if (loadingText) loadingText.textContent = stages[Math.min(Math.floor(progress / 20), stages.length - 1)];
    }, 200);
}

function showScreen(screenId) {
    console.log('Showing screen:', screenId);
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        gameState.currentScreen = screenId;
    }
    
    // Music handling
    try {
        if (screenId === 'gameScreen') {
            const menuMusic = document.getElementById('menuMusic');
            if (menuMusic && !menuMusic.paused) menuMusic.pause();
            
            if (gameState.is21BossFight) {
                const boss21Music = document.getElementById('boss21Music');
                if (boss21Music) {
                    boss21Music.currentTime = 0;
                    boss21Music.volume = 0.5;
                    boss21Music.play().catch(e => console.log("21 Boss music play failed"));
                }
            } else if (gameState.isBossFight) {
                const bossMusic = document.getElementById('bossMusic');
                if (bossMusic) {
                    bossMusic.currentTime = 0;
                    bossMusic.volume = 0.5;
                    bossMusic.play().catch(e => console.log("Boss music play failed"));
                }
            }
        } else {
            const bossMusic = document.getElementById('bossMusic');
            const boss21Music = document.getElementById('boss21Music');
            if (bossMusic && !bossMusic.paused) {
                bossMusic.pause();
                bossMusic.currentTime = 0;
            }
            if (boss21Music && !boss21Music.paused) {
                boss21Music.pause();
                boss21Music.currentTime = 0;
            }
            
            if (screenId !== 'gameScreen') {
                const menuMusic = document.getElementById('menuMusic');
                if (menuMusic && menuMusic.paused) {
                    menuMusic.currentTime = 0;
                    menuMusic.volume = 0.3;
                    menuMusic.play().catch(e => console.log("Menu music play failed"));
                }
            }
        }
    } catch (e) {
        console.log("Music handling error:", e);
    }
    
    if (screenId === 'gameScreen') {
        console.log("Game screen shown, initializing game...");
        setTimeout(() => {
            // Try to initialize Three.js if available
            if (typeof initThreeJS === 'function') {
                console.log("Calling initThreeJS...");
                try {
                    initThreeJS();
                } catch (e) {
                    console.error("Three.js initialization failed:", e);
                    // Continue anyway - we can use fallback
                }
            }
            
            // Focus canvas for keyboard input
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                canvas.focus();
            }
            
            // Start the game
            startGame();
        }, 100);
    } else if (screenId === 'shopScreen') {
        setTimeout(() => {
            if (typeof loadShopItems === 'function') {
                loadShopItems();
            }
        }, 100);
    } else if (screenId === 'characterSelect') {
        renderCharacterSelect();
    }
    
    const touchControls = document.getElementById('touchControls');
    if (touchControls) {
        touchControls.classList.toggle('active', 
            screenId === 'gameScreen' && gameState.deviceType === 'tablet' && !gameState.turnBased);
    }
}

// Character Select
function renderCharacterSelect() {
    const grid = document.getElementById('characterGrid');
    const difficultySelect = document.getElementById('difficultySelect');
    
    if (!grid) {
        console.error("Character grid not found!");
        return;
    }
    
    // Add boss difficulties if unlocked
    if (gameState.bossUnlocked && difficultySelect) {
        const sixtySevenOption = difficultySelect.querySelector('option[value="sixtyseven"]');
        if (!sixtySevenOption) {
            const option = document.createElement('option');
            option.value = 'sixtyseven';
            option.textContent = '67 BOSS - SURVIVAL';
            difficultySelect.appendChild(option);
        }
    }
    
    if (gameState.boss21Unlocked && difficultySelect) {
        const twentyOneOption = difficultySelect.querySelector('option[value="twentyone"]');
        if (!twentyOneOption) {
            const option = document.createElement('option');
            option.value = 'twentyone';
            option.textContent = '21 BOSS - TURN-BASED';
            difficultySelect.appendChild(option);
        }
    }
    
    grid.innerHTML = '';
    
    if (!CHARACTERS || !Array.isArray(CHARACTERS)) {
        console.error("CHARACTERS array not found or not an array!");
        return;
    }
    
    CHARACTERS.forEach((character, index) => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.innerHTML = `
            <div class="character-icon" style="background: ${character.color}20; border-color: ${character.color}">
                ${character.icon || character.name.charAt(0)}
            </div>
            <div class="character-name">${character.name}</div>
            <div class="character-style">${character.style}</div>
            <div class="character-stats">
                <div class="stat">
                    <div class="stat-value">${character.moves?.punch || 0}</div>
                    <div class="stat-label">PUNCH</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${character.moves?.kick || 0}</div>
                    <div class="stat-label">KICK</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${character.hp || 0}</div>
                    <div class="stat-label">HP</div>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            gameState.selectedCharacter = index;
            
            const confirmBtn = document.getElementById('confirmBtn');
            if (confirmBtn) confirmBtn.disabled = false;
            
            document.getElementById('previewName').textContent = character.name;
            document.getElementById('previewStyle').textContent = character.style;
            document.getElementById('previewDesc').textContent = character.description;
            document.getElementById('previewModel').textContent = character.icon || character.name.charAt(0);
            document.getElementById('previewModel').style.borderColor = character.color;
            
            updateBossUnlockInfo();
        });
        
        grid.appendChild(card);
    });
    
    if (difficultySelect) {
        difficultySelect.addEventListener('change', () => {
            gameState.difficulty = difficultySelect.value;
            updateBossUnlockInfo();
        });
    }
}

function updateBossUnlockInfo() {
    const difficulty = document.getElementById('difficultySelect')?.value || 'medium';
    const char = CHARACTERS[gameState.selectedCharacter];
    
    const bossUnlockInfo = document.getElementById('bossUnlockInfo');
    const bossUnlockedInfo = document.getElementById('bossUnlockedInfo');
    const bossWarningInfo = document.getElementById('bossWarningInfo');
    const boss21UnlockInfo = document.getElementById('boss21UnlockInfo');
    const boss21UnlockedInfo = document.getElementById('boss21UnlockedInfo');
    
    // Reset all
    [bossUnlockInfo, bossUnlockedInfo, bossWarningInfo, boss21UnlockInfo, boss21UnlockedInfo].forEach(el => {
        if (el) el.style.display = 'none';
    });
    
    // 67 Boss
    if (char && char.id === 67) {
        if (gameState.bossUnlocked) {
            if (bossUnlockedInfo) bossUnlockedInfo.style.display = 'block';
            if (difficulty === 'sixtyseven' && bossWarningInfo) {
                bossWarningInfo.style.display = 'block';
            }
        } else {
            if (bossUnlockInfo) bossUnlockInfo.style.display = 'block';
        }
    }
    
    // 21 Boss
    if (char && char.id === 21) {
        if (gameState.boss21Unlocked) {
            if (boss21UnlockedInfo) boss21UnlockedInfo.style.display = 'block';
        } else {
            if (boss21UnlockInfo) boss21UnlockInfo.style.display = 'block';
        }
    }
}

// Start Game
function startGame() {
    // CRITICAL FIX: Show the game screen before initializing the fight
    showScreen('gameScreen');
    
    console.log('Starting game... Mode:', gameState.gameMode);
    
    if (gameState.selectedCharacter === null || gameState.selectedCharacter === undefined) {
        console.error("No character selected!");
        alert('Please select a character first!');
        showScreen('characterSelect');
        return;
    }
    
    const difficultySelect = document.getElementById('difficultySelect');
    if (difficultySelect) {
        gameState.difficulty = difficultySelect.value;
    }
    
    const playerChar = CHARACTERS[gameState.selectedCharacter];
    if (!playerChar) {
        console.error("Selected character not found!");
        alert('Character data not found! Please try again.');
        showScreen('characterSelect');
        return;
    }
    
    const difficulty = DIFFICULTY_SETTINGS[gameState.difficulty] || DIFFICULTY_SETTINGS.medium;
    
    let cpuChar;
    let isBossFight = false;
    let is21BossFight = false;
    
    console.log("Starting with character:", playerChar.name, "Difficulty:", gameState.difficulty);
    
    // Check for 67 Boss
    if (gameState.difficulty === 'sixtyseven' && playerChar.id === 67 && gameState.bossUnlocked) {
        console.log("Starting 67 BOSS fight");
        cpuChar = BOSS_67 || CHARACTERS[0];
        isBossFight = true;
        gameState.isBossFight = true;
        gameState.is21BossFight = false;
        gameState.turnBased = false;
        startBossCutscene(BOSS_67_CUTSCENE, 10000);
        return;
    }
    // Check for 21 Boss
    else if (gameState.difficulty === 'twentyone' && playerChar.id === 21 && gameState.boss21Unlocked) {
        console.log("Starting 21 BOSS fight");
        cpuChar = BOSS_21 || CHARACTERS[0];
        is21BossFight = true;
        gameState.is21BossFight = true;
        gameState.isBossFight = false;
        gameState.turnBased = true;
        startBossCutscene(BOSS_21_CUTSCENE, 3000);
        return;
    }
    else {
        console.log("Starting normal fight");
        let cpuIndex;
        do {
            cpuIndex = Math.floor(Math.random() * CHARACTERS.length);
        } while (cpuIndex === gameState.selectedCharacter && CHARACTERS.length > 1);
        cpuChar = CHARACTERS[cpuIndex] || CHARACTERS[0];
        gameState.isBossFight = false;
        gameState.is21BossFight = false;
        gameState.turnBased = false;
    }
    
    initializeGameState(playerChar, cpuChar, difficulty, isBossFight, is21BossFight);
    
    if (!gameState.cutsceneActive) {
        console.log("Starting game loop...");
        startRoundTimer();
        animate();
    }
}

function initializeGameState(playerChar, cpuChar, difficulty, isBossFight, is21BossFight) {
    console.log("Initializing game state...");
    
    gameState.healCooldownActive = false;
    gameState.healCooldownEnd = 0;
    gameState.dodgeWindow = false;
    gameState.dodgeWarningActive = false;
    gameState.nextAttackTime = Date.now() + 3000;
    gameState.roundTime = 99;
    gameState.cutsceneActive = false;
    
    // Clear any existing timer
    if (gameState.roundTimerInterval) {
        clearInterval(gameState.roundTimerInterval);
        gameState.roundTimerInterval = null;
    }
    
    // Turn-based initialization
    if (is21BossFight) {
        gameState.playerTurn = true;
        gameState.charges = 0;
        gameState.bossCharges = 0;
        gameState.timingBarActive = false;
        gameState.spacePressed = false;
        gameState.holdingSpace = false;
        
        const turnBasedUI = document.getElementById('turnBasedUI');
        const touchControls = document.getElementById('touchControls');
        if (turnBasedUI) turnBasedUI.style.display = 'block';
        if (touchControls) touchControls.style.display = 'none';
        
        updateChargeCounter();
        updateTurnIndicator();
    } else {
        const turnBasedUI = document.getElementById('turnBasedUI');
        const touchControls = document.getElementById('touchControls');
        if (turnBasedUI) turnBasedUI.style.display = 'none';
        if (gameState.deviceType === 'tablet' && touchControls) {
            touchControls.style.display = 'flex';
        }
    }
    
    gameState.player = {
        character: playerChar,
        x: -5,
        z: 0,
        health: playerChar.hp || 100,
        maxHealth: playerChar.hp || 100,
        facing: 1,
        state: 'idle',
        stateTimer: 0,
        attackCooldown: 0,
        items: gameState.playerInventory || {}
    };
    
    gameState.cpu = {
        character: cpuChar,
        x: 5,
        z: 0,
        health: Math.floor((cpuChar.hp || 100) * (difficulty.cpuHpMultiplier || 1)),
        maxHealth: Math.floor((cpuChar.hp || 100) * (difficulty.cpuHpMultiplier || 1)),
        facing: -1,
        state: 'idle',
        stateTimer: 0,
        attackCooldown: 0,
        difficulty: difficulty,
        isBoss: isBossFight,
        is21Boss: is21BossFight
    };
    
    // Update UI
    const p1Name = document.getElementById('p1Name');
    const p2Name = document.getElementById('p2Name');
    const roundText = document.getElementById('roundText');
    const roundTimer = document.getElementById('roundTimer');
    
    if (p1Name) p1Name.textContent = playerChar.name;
    if (p2Name) p2Name.textContent = cpuChar.name;
    if (roundText) roundText.textContent = is21BossFight ? "TURN-BASED" : (isBossFight ? "SURVIVAL" : `ROUND 1`);
    if (roundTimer) roundTimer.textContent = gameState.roundTime;
    
    updateHealthBars();
    
    gameState.gameActive = true;
    console.log("Game state initialized. Player HP:", gameState.player.health, "CPU HP:", gameState.cpu.health);
}

// Start round timer
function startRoundTimer() {
    if (gameState.roundTimerInterval) {
        clearInterval(gameState.roundTimerInterval);
    }
    
    gameState.roundTimerInterval = setInterval(() => {
        if (gameState.gameActive && gameState.roundTime > 0 && !gameState.turnBased && !gameState.cutsceneActive) {
            gameState.roundTime--;
            const roundTimer = document.getElementById('roundTimer');
            if (roundTimer) roundTimer.textContent = gameState.roundTime;
            
            if (gameState.roundTime <= 0) {
                endRound();
            }
        }
    }, 1000);
}

// Boss Cutscene System
function startBossCutscene(texts, duration) {
    console.log("Starting boss cutscene...");
    gameState.cutsceneActive = true;
    gameState.cutsceneTexts = texts;
    gameState.cutsceneDuration = duration;
    gameState.cutsceneStartTime = Date.now();
    gameState.cutsceneTextIndex = 0;
    
    const gameCanvas = document.getElementById('gameCanvas');
    const hud = document.querySelector('.hud');
    const cutsceneOverlay = document.getElementById('cutsceneOverlay');
    
    if (gameCanvas) gameCanvas.style.opacity = '0.3';
    if (hud) hud.style.opacity = '0.3';
    if (cutsceneOverlay) cutsceneOverlay.style.display = 'flex';
    
    animateCutscene();
}

function animateCutscene() {
    if (!gameState.cutsceneActive) return;
    
    const cutsceneText = document.getElementById('cutsceneText');
    const texts = gameState.cutsceneTexts;
    const elapsed = Date.now() - gameState.cutsceneStartTime;
    const textDuration = gameState.cutsceneDuration / texts.length;
    const currentTextIndex = Math.floor(elapsed / textDuration);
    
    if (currentTextIndex < texts.length) {
        if (currentTextIndex !== gameState.cutsceneTextIndex) {
            gameState.cutsceneTextIndex = currentTextIndex;
            if (cutsceneText) {
                cutsceneText.textContent = texts[currentTextIndex];
                cutsceneText.style.opacity = '0';
                setTimeout(() => {
                    if (cutsceneText) cutsceneText.style.opacity = '1';
                }, 100);
            }
        }
        
        const progressInText = (elapsed % textDuration) / textDuration;
        if (cutsceneText) {
            if (progressInText > 0.8) {
                cutsceneText.style.opacity = (1 - ((progressInText - 0.8) * 5)).toString();
            } else if (progressInText < 0.2) {
                cutsceneText.style.opacity = (progressInText * 5).toString();
            }
        }
        
        requestAnimationFrame(animateCutscene);
    } else {
        endCutscene();
    }
}

function endCutscene() {
    console.log("Ending cutscene...");
    gameState.cutsceneActive = false;
    
    const cutsceneOverlay = document.getElementById('cutsceneOverlay');
    const gameCanvas = document.getElementById('gameCanvas');
    const hud = document.querySelector('.hud');
    
    if (cutsceneOverlay) cutsceneOverlay.style.display = 'none';
    if (gameCanvas) gameCanvas.style.opacity = '1';
    if (hud) hud.style.opacity = '1';
    
    const playerChar = CHARACTERS[gameState.selectedCharacter];
    let cpuChar;
    
    if (gameState.is21BossFight) {
        cpuChar = BOSS_21 || CHARACTERS[0];
    } else if (gameState.isBossFight) {
        cpuChar = BOSS_67 || CHARACTERS[0];
    } else {
        let cpuIndex;
        do {
            cpuIndex = Math.floor(Math.random() * CHARACTERS.length);
        } while (cpuIndex === gameState.selectedCharacter && CHARACTERS.length > 1);
        cpuChar = CHARACTERS[cpuIndex] || CHARACTERS[0];
    }
    
    const difficulty = DIFFICULTY_SETTINGS[gameState.difficulty] || DIFFICULTY_SETTINGS.medium;
    
    initializeGameState(playerChar, cpuChar, difficulty, gameState.isBossFight, gameState.is21BossFight);
    startRoundTimer();
    animate();
}

// Game Loop
function animate() {
    if (!gameState.gameActive) {
        console.log("Game not active, stopping animation");
        return;
    }
    
    requestAnimationFrame(animate);
    const delta = window.clock ? window.clock.getDelta() : 0.016;
    
    try {
        update();
        render();
        if (window.mixerPlayer) window.mixerPlayer.update(delta);
        if (window.mixerCpu) window.mixerCpu.update(delta);
    } catch (error) {
        console.error('Error in game loop:', error);
    }
}

function update() {
    if (!gameState.player || !gameState.cpu || gameState.cutsceneActive) return;
    
    // Turn-based mode update
    if (gameState.turnBased) {
        updateTurnBased();
        if (gameState.player.health <= 0 || gameState.cpu.health <= 0) {
            endRound();
        }
        return;
    }
    
    // Normal mode update (only runs when NOT turn-based)
    if (gameState.player.attackCooldown > 0) gameState.player.attackCooldown--;
    if (gameState.cpu.attackCooldown > 0) gameState.cpu.attackCooldown--;
    
    // Dodge warning system
    if (!gameState.dodgeWarningActive && Date.now() >= gameState.nextAttackTime - 1000) {
        showDodgeWarning();
    }
    
    // Trigger attack
    if (!gameState.dodgeWindow && Date.now() >= gameState.nextAttackTime) {
        triggerDodgeableAttack();
    }
    
    // CPU AI
    updateCPUAI();
    
    // Player movement
    if (gameState.keys["arrowleft"]) {
        gameState.player.x = Math.max(-8, gameState.player.x - 0.1);
        gameState.player.facing = -1;
        if (window.playerModel) {
            window.playerModel.position.x = gameState.player.x;
            window.playerModel.rotation.y = Math.PI;
        }
    }
    if (gameState.keys["arrowright"]) {
        gameState.player.x = Math.min(8, gameState.player.x + 0.1);
        gameState.player.facing = 1;
        if (window.playerModel) {
            window.playerModel.position.x = gameState.player.x;
            window.playerModel.rotation.y = 0;
        }
    }
    
    // Check win conditions (normal mode)
    if (gameState.player.health <= 0 || gameState.cpu.health <= 0) {
        endRound();
    }
}

// Turn-Based System
function updateTurnBased() {
    if (gameState.timingBarActive) {
        updateTimingBar();
        return;
    }
    
    updateChargeCounter();
}

function updateChargeCounter() {
    const counter = document.getElementById('chargeCounter');
    if (counter) counter.textContent = `CHARGES: ${gameState.charges}`;
    
    const fightBtn = document.getElementById('fightBtn');
    const healBtn = document.getElementById('healBtn');
    
    if (fightBtn) fightBtn.disabled = gameState.charges < 1 || !gameState.playerTurn;
    if (healBtn) healBtn.disabled = gameState.charges < 1 || !gameState.playerTurn;
}

function updateTurnIndicator() {
    const indicator = document.getElementById('turnIndicator');
    if (indicator) {
        indicator.textContent = gameState.playerTurn ? "YOUR TURN" : "BOSS TURN";
        indicator.style.color = gameState.playerTurn ? "#00ff00" : "#ff0033";
    }
    
    const chargeBtn = document.getElementById('chargeBtn');
    if (chargeBtn) chargeBtn.disabled = !gameState.playerTurn;
}

function playerCharge() {
    if (!gameState.playerTurn) return;
    gameState.charges++;
    updateChargeCounter();
    showMessage(`CHARGED! (${gameState.charges} charges)`, '#00ccff');
    endPlayerTurn();
}

function playerFight() {
    if (!gameState.playerTurn || gameState.charges < 1) return;
    
    gameState.charges--;
    updateChargeCounter();
    
    gameState.timingBarActive = true;
    gameState.timingBarProgress = 0;
    gameState.timingBarDirection = 1;
    gameState.holdingSpace = false;
    gameState.spacePressed = false;
    
    const timingBar = document.getElementById('timingBar');
    if (timingBar) timingBar.style.display = 'block';
    
    gameState.targetZoneStart = 0.2 + Math.random() * 0.5;
    gameState.targetZoneEnd = gameState.targetZoneStart + 0.2;
    
    const target = document.getElementById('timingBarTarget');
    if (target) {
        target.style.left = `${gameState.targetZoneStart * 100}%`;
        target.style.width = `${(gameState.targetZoneEnd - gameState.targetZoneStart) * 100}%`;
    }
}

function updateTimingBar() {
    if (!gameState.timingBarActive) return;
    
    if (gameState.player.attackCooldown > 0) gameState.player.attackCooldown = 20;
    if (gameState.cpu.attackCooldown > 0) gameState.cpu.attackCooldown = 20;
    
    if (gameState.spacePressed) {
        if (gameState.timingBarProgress >= gameState.targetZoneStart && 
            gameState.timingBarProgress <= gameState.targetZoneEnd) {
            executeTimingAttack(true);
        } else {
            executeTimingAttack(false);
        }
        gameState.spacePressed = false;
        return;
    }
    
    gameState.timingBarProgress += gameState.timingBarSpeed * gameState.timingBarDirection;
    
    if (gameState.timingBarProgress >= 1) {
        gameState.timingBarProgress = 1;
        gameState.timingBarDirection = -1;
    } else if (gameState.timingBarProgress <= 0) {
        gameState.timingBarProgress = 0;
        gameState.timingBarDirection = 1;
    }
    
    const fill = document.getElementById('timingBarFill');
    if (fill) fill.style.width = `${gameState.timingBarProgress * 100}%`;
}

function executeTimingAttack(success) {
    gameState.timingBarActive = false;
    const timingBar = document.getElementById('timingBar');
    if (timingBar) timingBar.style.display = 'none';
    
    if (success) {
        const damage = Math.floor((gameState.player.character.moves?.special || 50) * 2);
        gameState.cpu.health = Math.max(0, gameState.cpu.health - damage);
        showMessage(`PERFECT HIT! ${damage} DAMAGE!`, '#00ff00');
        if (typeof createBloodEffect === 'function') createBloodEffect(gameState.cpu.x, 1, 0);
    } else {
        const damage = Math.floor((gameState.player.character.moves?.punch || 30) * 0.5);
        gameState.cpu.health = Math.max(0, gameState.cpu.health - damage);
        showMessage(`WEAK HIT! ${damage} DAMAGE`, '#ff9900');
    }
    
    updateHealthBars();
    
    if (gameState.cpu.health <= 0) {
        endRound();
    } else {
        endPlayerTurn();
    }
}

function playerHeal() {
    if (!gameState.playerTurn || gameState.charges < 1) return;
    
    gameState.charges--;
    const healAmount = Math.floor(gameState.player.maxHealth * 0.3);
    gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + healAmount);
    updateHealthBars();
    showMessage(`HEALED ${healAmount} HP!`, '#00ff00');
    updateChargeCounter();
    endPlayerTurn();
}

function endPlayerTurn() {
    gameState.playerTurn = false;
    updateTurnIndicator();
    updateChargeCounter();
    
    setTimeout(() => {
        executeBossTurn();
    }, 1000);
}

function executeBossTurn() {
    const bossAction = document.getElementById('bossAction');
    
    gameState.bossCharges++;
    
    if (gameState.bossCharges >= 2) {
        const actions = ['GUN', 'CHARGE', 'DASH'];
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        if (bossAction) {
            bossAction.textContent = `BOSS USES ${action}!`;
            bossAction.style.display = 'block';
        }
        
        setTimeout(() => {
            showDodgeWarning();
            gameState.dodgeWindow = true;
            
            setTimeout(() => {
                hideDodgeWarning();
                gameState.dodgeWindow = false;
                
                if (!gameState.dodgeSuccessful) {
                    const damage = Math.floor((gameState.cpu.character.moves?.special || 60) * 1.5);
                    gameState.player.health = Math.max(0, gameState.player.health - damage);
                    updateHealthBars();
                    showMessage(`BOSS HIT! ${damage} DAMAGE!`, '#ff0033');
                    if (typeof createBloodEffect === 'function') createBloodEffect(gameState.player.x, 1, 0);
                }
                gameState.dodgeSuccessful = false;
                gameState.bossCharges = 0;
                
                if (bossAction) bossAction.style.display = 'none';
                
                if (gameState.player.health <= 0) {
                    endRound();
                } else {
                    setTimeout(() => {
                        gameState.playerTurn = true;
                        updateTurnIndicator();
                        updateChargeCounter();
                    }, 1000);
                }
            }, 2000);
        }, 1000);
    } else {
        if (bossAction) {
            bossAction.textContent = `BOSS CHARGES! (${gameState.bossCharges}/2)`;
            bossAction.style.display = 'block';
        }
        
        setTimeout(() => {
            if (bossAction) bossAction.style.display = 'none';
            gameState.playerTurn = true;
            updateTurnIndicator();
            updateChargeCounter();
        }, 1500);
    }
}

// Dodge System (G key)
function showDodgeWarning() {
    gameState.dodgeWarningActive = true;
    const warning = document.getElementById('dodgeWarning');
    if (warning) {
        warning.style.display = 'block';
        warning.style.animation = 'warningPulse 0.3s infinite';
    }
}

function hideDodgeWarning() {
    gameState.dodgeWarningActive = false;
    const warning = document.getElementById('dodgeWarning');
    if (warning) {
        warning.style.display = 'none';
    }
}

function triggerDodgeableAttack() {
    gameState.dodgeWindow = true;
    hideDodgeWarning();
    
    setTimeout(() => {
        if (gameState.dodgeWindow && !gameState.dodgeSuccessful) {
            const damage = Math.floor((gameState.cpu.character.moves?.special || 60) * 1.2);
            gameState.player.health = Math.max(0, gameState.player.health - damage);
            updateHealthBars();
            if (typeof createBloodEffect === 'function') createBloodEffect(gameState.player.x, 1, 0);
            showMessage(`HIT! ${damage} DAMAGE`, '#ff0033');
        }
        
        gameState.dodgeWindow = false;
        gameState.dodgeSuccessful = false;
        gameState.nextAttackTime = Date.now() + 3000 + Math.random() * 2000;
    }, 500);
}

function attemptDodge() {
    if (gameState.dodgeWarningActive || gameState.dodgeWindow) {
        gameState.dodgeSuccessful = true;
        hideDodgeWarning();
        showMessage('PERFECT DODGE!', '#00ff00');
        
        if (window.playerModel) {
            const originalX = window.playerModel.position.x;
            window.playerModel.position.x += 2;
            setTimeout(() => {
                if (window.playerModel) window.playerModel.position.x = originalX;
            }, 300);
        }
    }
}

// CPU AI
function updateCPUAI() {
    if (gameState.turnBased) return;
    
    const distance = gameState.cpu.x - gameState.player.x;
    
    if (Math.abs(distance) > 2.5) {
        gameState.cpu.x += (distance > 0 ? -0.05 : 0.05);
    }
    
    if (window.cpuModel) {
        window.cpuModel.position.x = gameState.cpu.x;
        window.cpuModel.rotation.y = (distance > 0 ? Math.PI : 0);
    }
    
    if (Math.random() < (gameState.cpu.difficulty?.aggression || 0.6) * 0.02 && 
        gameState.cpu.attackCooldown <= 0 && 
        Math.abs(distance) < 3) {
        const attackTypes = ['punch', 'kick', 'special'];
        const attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
        doCpuAttack(attackType);
        gameState.cpu.attackCooldown = 25 / (gameState.cpu.difficulty?.aggression || 0.6);
    }
}

function doCpuAttack(type) {
    if (gameState.turnBased) return;
    
    let damage = 0;
    const difficulty = gameState.cpu.difficulty || { aggression: 0.6 };
    
    if (type === 'punch') {
        damage = ((gameState.cpu.character.moves?.punch || 30) + Math.floor(Math.random() * 8)) * difficulty.aggression;
    } else if (type === 'kick') {
        damage = ((gameState.cpu.character.moves?.kick || 30) + Math.floor(Math.random() * 8)) * difficulty.aggression;
    } else if (type === 'special') {
        damage = ((gameState.cpu.character.moves?.special || 50) + Math.floor(Math.random() * 12)) * difficulty.aggression;
    }
    
    gameState.player.health = Math.max(0, gameState.player.health - damage);
    updateHealthBars();
    if (typeof createBloodEffect === 'function') createBloodEffect(gameState.player.x, 1, 0);
    
    if (window.playerModel) {
        const knockback = 0.3;
        window.playerModel.position.x -= knockback;
        setTimeout(() => {
            if (window.playerModel) window.playerModel.position.x += knockback * 0.5;
        }, 100);
    }
}

// Player Actions
function doPlayerAttack(type) {
    if (!gameState.gameActive || gameState.player.attackCooldown > 0 || gameState.turnBased) return;
    
    if (type === 'heal') {
        if (gameState.healCooldownActive) {
            const timeLeft = Math.ceil((gameState.healCooldownEnd - Date.now()) / 1000);
            showMessage(`HEAL COOLDOWN: ${timeLeft}s`, '#ff9900');
            return;
        }
        
        const healAmount = gameState.player.maxHealth * 0.10;
        gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + healAmount);
        updateHealthBars();
        showMessage('HEALED +10% HP!', '#00ff00');
        
        gameState.healCooldownActive = true;
        gameState.healCooldownEnd = Date.now() + 10000;
        
        const healButtons = document.querySelectorAll('[data-action="heal"]');
        healButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        });
        
        const cooldownInterval = setInterval(() => {
            const timeLeft = Math.ceil((gameState.healCooldownEnd - Date.now()) / 1000);
            
            if (timeLeft <= 0) {
                clearInterval(cooldownInterval);
                gameState.healCooldownActive = false;
                healButtons.forEach(btn => {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                });
                showMessage("HEAL READY!", '#00ff00');
            }
        }, 1000);
        
        return;
    }
    
    const distance = Math.abs(gameState.player.x - gameState.cpu.x);
    if (distance > 3) {
        showMessage('TOO FAR!', '#ff9900');
        return;
    }
    
    gameState.player.attackCooldown = 20;
    
    let damage = 0;
    
    if (type === 'punch') {
        damage = (gameState.player.character.moves?.punch || 30) + Math.floor(Math.random() * 10);
    } else if (type === 'kick') {
        damage = (gameState.player.character.moves?.kick || 30) + Math.floor(Math.random() * 10);
    } else if (type === 'special') {
        damage = (gameState.player.character.moves?.special || 50) + Math.floor(Math.random() * 15);
    }
    
    gameState.cpu.health = Math.max(0, gameState.cpu.health - damage);
    updateHealthBars();
    if (typeof createBloodEffect === 'function') createBloodEffect(gameState.cpu.x, 1, 0);
    
    if (window.cpuModel) {
        const knockback = 0.3;
        window.cpuModel.position.x += knockback;
        setTimeout(() => {
            if (window.cpuModel) window.cpuModel.position.x -= knockback * 0.5;
        }, 100);
    }
    
    gameState.score += damage;
    showMessage(`${type.toUpperCase()}! ${damage} DAMAGE`, '#ffcc00');
}

// UI Updates
function updateHealthBars() {
    const p1Health = document.getElementById('p1Health');
    const p2Health = document.getElementById('p2Health');
    const p1HealthText = document.getElementById('p1HealthText');
    const p2HealthText = document.getElementById('p2HealthText');
    
    if (!p1Health || !p2Health) return;
    
    const p1Percent = gameState.player.health / gameState.player.maxHealth;
    const p2Percent = gameState.cpu.health / gameState.cpu.maxHealth;
    
    p1Health.style.width = `${p1Percent * 100}%`;
    p2Health.style.width = `${p2Percent * 100}%`;
    
    if (p1HealthText) p1HealthText.textContent = `${Math.round(p1Percent * 100)}%`;
    if (p2HealthText) p2HealthText.textContent = `${Math.round(p2Percent * 100)}%`;
}

function showMessage(text, color = '#ffcc00') {
    const display = document.getElementById('comboDisplay');
    if (display) {
        display.textContent = text;
        display.style.color = color;
        display.classList.add('active');
        setTimeout(() => display.classList.remove('active'), 2000);
    }
    console.log("Game Message:", text);
}

function render() {
    // Try Three.js renderer first
    if (window.renderer && window.scene && window.camera) {
        try {
            window.renderer.render(window.scene, window.camera);
        } catch (e) {
            console.error("Three.js render failed:", e);
        }
    }
    // If Three.js fails, the 2D fallback will handle rendering
}

// End Round
function endRound() {
    console.log("Ending round...");
    gameState.gameActive = false;
    
    // Clear the round timer
    if (gameState.roundTimerInterval) {
        clearInterval(gameState.roundTimerInterval);
        gameState.roundTimerInterval = null;
    }
    
    // Stop music
    try {
        const bossMusic = document.getElementById('bossMusic');
        const boss21Music = document.getElementById('boss21Music');
        if (bossMusic && !bossMusic.paused) {
            bossMusic.pause();
            bossMusic.currentTime = 0;
        }
        if (boss21Music && !boss21Music.paused) {
            boss21Music.pause();
            boss21Music.currentTime = 0;
        }
    } catch (e) {
        console.log("Music stop error:", e);
    }
    
    let message = "TIME OVER!";
    let coinsEarned = 0;
    
    if (gameState.player.health <= 0) {
        message = "CPU WINS!";
    } else if (gameState.cpu.health <= 0) {
        message = "PLAYER WINS!";
        gameState.score += 1000;
        coinsEarned = 50;
        gameState.coins += coinsEarned;
        
        // Unlock checks
        if (gameState.difficulty === 'insane' && CHARACTERS[gameState.selectedCharacter]?.id === 67) {
            gameState.bossUnlocked = true;
            localStorage.setItem('boss67Unlocked', 'true');
        }
        
        if (gameState.difficulty === 'hard' && CHARACTERS[gameState.selectedCharacter]?.id === 21) {
            gameState.boss21Unlocked = true;
            localStorage.setItem('boss21Unlocked', 'true');
        }
        
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('brainrotHighScore', gameState.highScore);
        }
        
        localStorage.setItem('brainrotCoins', gameState.coins);
        spawn67();
    }
    
    setTimeout(() => {
        alert(`${message}\nScore: ${gameState.score}\nCoins Earned: ${coinsEarned}`);
        showScreen('characterSelect');
    }, 1000);
}

function spawn67() {
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const element = document.createElement('div');
            element.className = 'secret-67';
            element.textContent = '67';
            element.style.left = `${Math.random() * 80 + 10}%`;
            element.style.top = `${Math.random() * 80 + 10}%`;
            document.body.appendChild(element);
            
            setTimeout(() => {
                element.remove();
            }, 2000);
        }, i * 100);
    }
}

// Background Management
function applyCustomBackground() {
    const body = document.body;
    body.classList.remove('bg-space', 'bg-neon', 'bg-matrix', 'bg-fire', 'bg-ice');
    
    if (gameState.customBackground !== 'default') {
        body.classList.add(`bg-${gameState.customBackground}`);
    }
}

function selectBackground(bgType) {
    gameState.customBackground = bgType;
    localStorage.setItem('customBackground', bgType);
    applyCustomBackground();
    showMessage('Background Changed!', '#00ff00');
}

// Event Listeners
function setupEventListeners() {
    console.log("Setting up event listeners...");
    
    const buttons = {
        'arcadeBtn': () => {
            console.log("Arcade button clicked");
            gameState.gameMode = 'arcade';
            showScreen('characterSelect');
        },
        'practiceBtn': () => {
            console.log("Practice button clicked");
            gameState.gameMode = 'practice';
            showScreen('characterSelect');
        },
        'shopBtn': () => {
            console.log("Shop button clicked");
            showScreen('shopScreen');
        },
        'controlsBtn': () => {
            console.log("Controls button clicked");
            showScreen('controlsScreen');
        },
        'updatesBtn': () => {
            console.log("Updates button clicked");
            showScreen('updatesScreen');
        },
        'creditsBtn': () => {
            console.log("Credits button clicked");
            showScreen('creditsScreen');
        },
        'backgroundBtn': () => {
            console.log("Background button clicked");
            showScreen('backgroundScreen');
        },
        'backBtn': () => {
            console.log("Back button clicked");
            showScreen('mainMenu');
        },
        'controlsBackBtn': () => {
            console.log("Controls back button clicked");
            showScreen('mainMenu');
        },
        'shopBackBtn': () => {
            console.log("Shop back button clicked");
            showScreen('mainMenu');
        },
        'updatesBackBtn': () => {
            console.log("Updates back button clicked");
            showScreen('mainMenu');
        },
        'creditsBackBtn': () => {
            console.log("Credits back button clicked");
            showScreen('mainMenu');
        },
        'backgroundBackBtn': () => {
            console.log("Background back button clicked");
            showScreen('mainMenu');
        },
        'exitBattleBtn': () => {
            console.log("Exit battle button clicked");
            if (gameState.roundTimerInterval) {
                clearInterval(gameState.roundTimerInterval);
                gameState.roundTimerInterval = null;
            }
            gameState.gameActive = false;
            showScreen('characterSelect');
        },
        'confirmBtn': () => {
            console.log("Confirm/Fight button clicked");
            startGame();
        },
        'chargeBtn': () => {
            console.log("Charge button clicked");
            playerCharge();
        },
        'fightBtn': () => {
            console.log("Fight button clicked");
            playerFight();
        },
        'healBtn': () => {
            console.log("Heal button clicked");
            playerHeal();
        }
    };
    
    Object.entries(buttons).forEach(([id, handler]) => {
        const btn = document.getElementById(id);
        if (btn) {
            console.log(`Setting up listener for ${id}`);
            btn.addEventListener('click', handler);
        } else {
            console.warn(`Button ${id} not found!`);
        }
    });
    
    // Background selection
    document.querySelectorAll('.bg-option').forEach(option => {
        option.addEventListener('click', () => {
            const bg = option.dataset.bg;
            selectBackground(bg);
        });
    });
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (gameState.cutsceneActive) return;
        
        const key = e.key.toLowerCase();
        gameState.keys[key] = true;
        
        // Turn-based timing bar (SPACE to stop bar)
        if (gameState.turnBased && gameState.timingBarActive && key === ' ') {
            e.preventDefault();
            gameState.spacePressed = true;
        }
        
        // Dodge with G key
        if (!gameState.turnBased && key === 'g') {
            attemptDodge();
        }
        
        // Normal attacks (non-turn-based)
        if (!gameState.turnBased && gameState.gameActive && gameState.player.attackCooldown <= 0) {
            if (key === 'z' || key === 'x') {
                doPlayerAttack('punch');
            } else if (key === 'a' || key === 's') {
                doPlayerAttack('kick');
            } else if (key === ' ') {
                e.preventDefault();
                doPlayerAttack('heal');
            } else if (key === 'c') {
                doPlayerAttack('special');
            }
        }
    });
    
    document.addEventListener('keyup', (e) => {
        gameState.keys[e.key.toLowerCase()] = false;
    });
    
    console.log("Event listeners setup complete");
}

// Boss unlock check
function checkBossUnlock() {
    if (localStorage.getItem('boss67Unlocked') === 'true') {
        gameState.bossUnlocked = true;
    }
    if (localStorage.getItem('boss21Unlocked') === 'true') {
        gameState.boss21Unlocked = true;
    }
}

// Difficulty Settings
const DIFFICULTY_SETTINGS = {
    easy: { cpuHpMultiplier: 0.8, parryChance: 0.2, aggression: 0.3 },
    medium: { cpuHpMultiplier: 1.0, parryChance: 0.5, aggression: 0.6 },
    hard: { cpuHpMultiplier: 1.3, parryChance: 0.8, aggression: 0.9 },
    insane: { cpuHpMultiplier: 1.5, parryChance: 1.0, aggression: 1.0 },
    sixtyseven: { cpuHpMultiplier: 2.5, parryChance: 0.0, aggression: 1.2, isBoss: true },
    twentyone: { cpuHpMultiplier: 2.0, parryChance: 0.0, aggression: 1.0, isBoss: true }
};

window.addEventListener('load', init);

// 2D Fallback Renderer (when Three.js fails)
let fallbackRunning = false;
function init2DFallback() {
    if (fallbackRunning) {
        console.log("2D fallback already running, skipping.");
        return;
    }
    fallbackRunning = true;
    
    console.log("Initializing 2D fallback renderer...");
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    // Use the canvas's existing pixel dimensions (set by width/height attributes)
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Create a simple 2D render loop
    function render2D() {
        if (!gameState.gameActive || !gameState.player || !gameState.cpu) {
            // If game is not active, still try to draw a placeholder or just clear
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            requestAnimationFrame(render2D);
            return;
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // Draw arena
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Draw floor
        ctx.fillStyle = '#222244';
        ctx.fillRect(0, canvasHeight - 50, canvasWidth, 50);
        
        // Draw grid lines
        ctx.strokeStyle = '#333366';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvasWidth; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvasHeight);
            ctx.stroke();
        }
        
        // Draw fighters
        const playerX = (gameState.player.x + 10) * (canvasWidth / 20);
        const playerY = canvasHeight / 2;
        const cpuX = (gameState.cpu.x + 10) * (canvasWidth / 20);
        const cpuY = canvasHeight / 2;
        
        // Player character
        ctx.fillStyle = gameState.player.character?.color || '#ff0033';
        ctx.beginPath();
        ctx.arc(playerX, playerY, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Player name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(gameState.player.character?.name || 'PLAYER', playerX, playerY - 40);
        
        // CPU character - ensure character exists
        const cpuChar = gameState.cpu.character;
        if (cpuChar) {
            ctx.fillStyle = cpuChar.color || '#00ccff';
        } else {
            ctx.fillStyle = '#00ccff';
        }
        ctx.beginPath();
        ctx.arc(cpuX, cpuY, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // CPU name
        ctx.fillStyle = '#ffffff';
        ctx.fillText(cpuChar ? cpuChar.name : 'CPU', cpuX, cpuY - 40);
        
        // Draw health indicators
        const barWidth = 100;
        const barHeight = 15;
        
        // Player health
        const playerHealthPercent = gameState.player.health / gameState.player.maxHealth;
        ctx.fillStyle = '#333333';
        ctx.fillRect(playerX - barWidth/2, playerY + 40, barWidth, barHeight);
        ctx.fillStyle = playerHealthPercent > 0.5 ? '#00ff00' : playerHealthPercent > 0.2 ? '#ffff00' : '#ff0000';
        ctx.fillRect(playerX - barWidth/2, playerY + 40, barWidth * playerHealthPercent, barHeight);
        
        // CPU health
        const cpuHealthPercent = gameState.cpu.health / gameState.cpu.maxHealth;
        ctx.fillStyle = '#333333';
        ctx.fillRect(cpuX - barWidth/2, cpuY + 40, barWidth, barHeight);
        ctx.fillStyle = cpuHealthPercent > 0.5 ? '#00ff00' : cpuHealthPercent > 0.2 ? '#ffff00' : '#ff0000';
        ctx.fillRect(cpuX - barWidth/2, cpuY + 40, barWidth * cpuHealthPercent, barHeight);
        
        // Draw health text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Courier New';
        ctx.fillText(`${Math.round(gameState.player.health)}/${gameState.player.maxHealth}`, playerX, playerY + 52);
        ctx.fillText(`${Math.round(gameState.cpu.health)}/${gameState.cpu.maxHealth}`, cpuX, cpuY + 52);
        
        // Draw distance indicator
        const distance = Math.abs(gameState.player.x - gameState.cpu.x);
        ctx.fillStyle = distance < 3 ? '#ff9900' : '#00ccff';
        ctx.font = 'bold 14px Courier New';
        ctx.fillText(`DISTANCE: ${distance.toFixed(1)}`, canvasWidth/2, 30);
        
        // Request next frame
        requestAnimationFrame(render2D);
    }
    
    // Start 2D rendering
    render2D();
    console.log("2D fallback renderer started");
}

// Override the showScreen function to include 2D fallback
const originalShowScreen = showScreen;
window.showScreen = function(screenId) {
    originalShowScreen(screenId);
    
    if (screenId === 'gameScreen') {
        // Try Three.js first, if fails use 2D fallback
        setTimeout(() => {
            if (typeof initThreeJS === 'function') {
                try {
                    console.log("Attempting Three.js initialization...");
                    initThreeJS();
                    
                    // Check if Three.js succeeded
                    if (!window.scene || !window.camera || !window.renderer) {
                        console.log("Three.js objects not created, using 2D fallback");
                        init2DFallback();
                    } else {
                        console.log("Three.js initialized successfully");
                    }
                } catch (e) {
                    console.error("Three.js initialization failed:", e);
                    console.log("Falling back to 2D renderer");
                    init2DFallback();
                }
            } else {
                console.log("Three.js not available, using 2D fallback");
                init2DFallback();
            }
        }, 200);
    }
};
