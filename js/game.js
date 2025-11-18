// Game State - UPDATED FOR v4.0
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
    comboCount: 0,
    score: 0,
    coins: parseInt(localStorage.getItem('brainrotCoins')) || 1000,
    highScore: localStorage.getItem('brainrotHighScore') || 0,
    deviceType: 'desktop',
    gameMode: 'arcade',
    difficulty: 'medium',
    cpuMemory: JSON.parse(localStorage.getItem('cpuMemory')) || {},
    playerInventory: JSON.parse(localStorage.getItem('playerInventory')) || {},
    practiceStats: {
        comboCount: 0,
        damageDealt: 0,
        startTime: 0
    },
    parryCooldownActive: false,
    parryCooldownEnd: 0,
    bossUnlocked: localStorage.getItem('boss67Unlocked') === 'true',
    bossDefeated: localStorage.getItem('boss67Defeated') === 'true',
    isBossFight: false,
    bossSpecialAttackCooldown: 0,
    bossStunTimer: 0,
    isBossStunned: false,
    // UPDATED: Balanced survival mode variables
    bossSelfDamageTimer: 0,
    playerHiddenHealTimer: 0,
    playerFakeHP: 100,
    playerRealHP: 100,
    survivalPhase: 0,
    cutsceneActive: false,
    cutsceneTimer: 0,
    currentCutsceneText: "",
    cutsceneTextIndex: 0,
    // NEW: Online multiplayer
    onlineMatch: null,
    opponent: null,
    onlineInputs: [],
    lastInputSequence: 0
};

// UPDATED: Balanced 67 Boss Settings
const BOSS_BALANCED_SETTINGS = {
    selfDamageInterval: 400, // Reduced from 500 (easier)
    selfDamageAmount: 0.08, // Reduced from 0.10 (8% instead of 10%)
    stunDuration: 400, // Reduced stun duration
    playerHealInterval: 400, // More frequent healing
    phaseDamageMultiplier: 0.05 // Reduced phase scaling
};

// Cutscene text for 67 Boss - ADDED BEAT DROP
const BOSS_CUTSCENE_TEXTS = [
    "THE LEGEND OF 67...",
    "A FORCE BEYOND COMPREHENSION...",
    "IT CORRUPTS EVERYTHING IT TOUCHES...",
    "YOU CANNOT DEFEAT IT...",
    "YOU CAN ONLY SURVIVE...",
    "BEGIN!"
];

// Difficulty Settings - UPDATED BOSS DIFFICULTY
const DIFFICULTY_SETTINGS = {
    easy: {
        cpuHpMultiplier: 0.8,
        parryChance: 0.2,
        aggression: 0.3,
        learningRate: 0.1
    },
    medium: {
        cpuHpMultiplier: 1.0,
        parryChance: 0.5,
        aggression: 0.6,
        learningRate: 0.3
    },
    hard: {
        cpuHpMultiplier: 1.3,
        parryChance: 0.8,
        aggression: 0.9,
        learningRate: 0.5
    },
    insane: {
        cpuHpMultiplier: 1.5,
        parryChance: 1.0,
        aggression: 1.0,
        learningRate: 0.8
    },
    sixtyseven: {
        cpuHpMultiplier: 2.0, // Reduced from 2.5
        parryChance: 0.0,
        aggression: 1.0, // Reduced from 1.2
        learningRate: 0.7, // Reduced from 0.9
        isBoss: true
    }
};

// Initialize Game - UPDATED FOR ONLINE
function init() {
    console.log('Initializing Brainrot Fighters v4.0...');
    document.getElementById('highScore').textContent = gameState.highScore;
    document.getElementById('coinsAmount').textContent = gameState.coins;
    detectDevice();
    setupEventListeners();
    renderCharacterSelect();
    
    // Check if boss should be unlocked
    checkBossUnlock();
    
    // Initialize shop
    if (typeof loadShopItems === 'function') {
        setTimeout(loadShopItems, 100);
    }
    
    // Start menu music
    if (menuMusic) {
        menuMusic.volume = 0.7;
        menuMusic.play().catch(e => {
            console.log("Menu music play failed:", e);
        });
    }
    
    // Initialize online system if available
    if (typeof initOnlineSystem === 'function') {
        setTimeout(() => {
            initOnlineSystem();
        }, 1000);
    }
}

// UPDATED: Start Battle with Online Support
function startBattle(mode = 'arcade') {
    if (gameState.selectedCharacter === null) {
        alert('Please select a character first!');
        return;
    }
    
    gameState.gameMode = mode;
    gameState.difficulty = document.getElementById('difficultySelect').value;
    
    // Check if this is a boss fight
    gameState.isBossFight = (gameState.difficulty === 'sixtyseven' && 
                            CHARACTERS[gameState.selectedCharacter].id === 67);
    
    if (gameState.isBossFight) {
        console.log('STARTING BALANCED 67 BOSS SURVIVAL MODE!');
    }
    
    showScreen('gameScreen');
}

// UPDATED: Start Game with Online Support
function startGame() {
    console.log('Starting game...');
    
    if (gameState.gameMode === 'online' && gameState.onlineMatch) {
        startOnlineGame();
        return;
    }
    
    // Single player game
    if (gameState.selectedCharacter === null) {
        console.error('No character selected');
        showScreen('characterSelect');
        return;
    }
    
    const playerChar = CHARACTERS[gameState.selectedCharacter];
    const difficulty = DIFFICULTY_SETTINGS[gameState.difficulty];
    
    let cpuChar;
    let isBossFight = false;
    
    if (gameState.isBossFight) {
        cpuChar = BOSS_67;
        isBossFight = true;
        console.log('BALANCED BOSS SURVIVAL MODE INITIATED!');
        startBossCutscene();
    } else {
        let cpuIndex;
        do {
            cpuIndex = Math.floor(Math.random() * CHARACTERS.length);
        } while (cpuIndex === gameState.selectedCharacter && CHARACTERS.length > 1);
        cpuChar = CHARACTERS[cpuIndex];
    }
    
    setupSinglePlayerGame(playerChar, cpuChar, difficulty, isBossFight);
}

// NEW: Start Online Game
function startOnlineGame() {
    const playerChar = CHARACTERS[gameState.selectedCharacter];
    
    gameState.player = {
        character: playerChar,
        x: -5,
        z: 0,
        health: playerChar.hp,
        maxHealth: playerChar.hp,
        facing: 1,
        state: 'idle',
        stateTimer: 0,
        attackCooldown: 0,
        parryCooldown: 0,
        parryAvailable: true,
        items: gameState.playerInventory
    };
    
    // Create placeholder opponent
    gameState.opponent = {
        character: CHARACTERS[0], // Default character
        x: 5,
        z: 0,
        health: CHARACTERS[0].hp,
        maxHealth: CHARACTERS[0].hp,
        facing: -1,
        state: 'idle'
    };
    
    document.getElementById('p1Name').textContent = playerChar.name;
    document.getElementById('p2Name').textContent = "OPPONENT";
    document.getElementById('roundText').textContent = "ONLINE MATCH";
    
    updateHealthBars();
    
    gameState.gameActive = true;
    gameState.roundTime = 99;
    
    console.log('Online game started');
    animate();
}

// UPDATED: Setup Single Player Game
function setupSinglePlayerGame(playerChar, cpuChar, difficulty, isBossFight) {
    const memoryKey = `${gameState.selectedCharacter}_${gameState.difficulty}`;
    if (!gameState.cpuMemory[memoryKey]) {
        gameState.cpuMemory[memoryKey] = {
            playerMoves: {punch: 1, kick: 1, special: 1, parry: 1},
            comboPatterns: {},
            dodgeChance: 0.1,
            counterChance: 0.1,
            fights: 0
        };
    }
    
    const cpuMemory = gameState.cpuMemory[memoryKey];
    cpuMemory.fights++;
    
    // Reset all cooldowns and timers
    resetGameTimers();
    
    gameState.player = {
        character: playerChar,
        x: -5,
        z: 0,
        health: playerChar.hp,
        maxHealth: playerChar.hp,
        facing: 1,
        state: 'idle',
        stateTimer: 0,
        attackCooldown: 0,
        parryCooldown: 0,
        parryAvailable: true,
        items: gameState.playerInventory
    };
    
    gameState.cpu = {
        character: cpuChar,
        x: 5,
        z: 0,
        health: Math.floor(cpuChar.hp * difficulty.cpuHpMultiplier),
        maxHealth: Math.floor(cpuChar.hp * difficulty.cpuHpMultiplier),
        facing: -1,
        state: 'idle',
        stateTimer: 0,
        attackCooldown: 0,
        memory: cpuMemory,
        difficulty: difficulty,
        lastPlayerMove: null,
        isBoss: isBossFight
    };
    
    document.getElementById('p1Name').textContent = playerChar.name;
    document.getElementById('p2Name').textContent = cpuChar.name;
    
    if (isBossFight) {
        document.getElementById('p2Name').textContent = "67 BOSS";
        document.getElementById('p2Name').style.color = "#ff0000";
        document.getElementById('roundText').textContent = "SURVIVAL MODE";
    } else {
        document.getElementById('p2Name').style.color = "";
        document.getElementById('roundText').textContent = `ROUND ${gameState.round || 1}`;
    }
    
    document.getElementById('roundTimer').textContent = gameState.roundTime;
    
    updateHealthBars();
    
    gameState.gameActive = true;
    gameState.roundTime = 99;
    gameState.comboCount = 0;
    gameState.score = 0;
    
    console.log('Game started:', playerChar.name, 'vs', cpuChar.name);
    
    if (!gameState.cutsceneActive) {
        animate();
    }
}

// UPDATED: Reset Game Timers with Balanced Values
function resetGameTimers() {
    gameState.parryCooldownActive = false;
    gameState.parryCooldownEnd = 0;
    gameState.bossSpecialAttackCooldown = 0;
    gameState.bossStunTimer = 0;
    gameState.isBossStunned = false;
    
    // UPDATED: Balanced survival mode timers
    gameState.bossSelfDamageTimer = 0;
    gameState.playerHiddenHealTimer = 0;
    gameState.playerFakeHP = 100;
    gameState.playerRealHP = 100;
    gameState.survivalPhase = 0;
    
    // Re-enable parry buttons
    const parryButtons = document.querySelectorAll('[data-action="parry"]');
    parryButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.background = 'rgba(100, 255, 100, 0.7)';
        btn.textContent = 'PARRY';
    });
}

// UPDATED: Event Listeners with Online Support
function setupEventListeners() {
    console.log('Setting up event listeners for v4.0...');
    
    // Device detection
    const forceTablet = document.getElementById('forceTablet');
    const forceDesktop = document.getElementById('forceDesktop');
    
    if (forceTablet) forceTablet.addEventListener('click', () => {
        gameState.deviceType = 'tablet';
        document.getElementById('deviceType').textContent = 'TABLET MODE';
        simulateLoading();
    });
    
    if (forceDesktop) forceDesktop.addEventListener('click', () => {
        gameState.deviceType = 'desktop';
        document.getElementById('deviceType').textContent = 'DESKTOP MODE';
        simulateLoading();
    });
    
    // Main menu buttons
    const buttons = [
        'arcadeBtn', 'onlineBtn', 'practiceBtn', 'shopBtn', 'controlsBtn', 'updatesBtn', 'creditsBtn',
        'comboPracticeBtn', 'freePracticeBtn', 'dummySettingsBtn', 'practiceBackBtn',
        'backBtn', 'controlsBackBtn', 'shopBackBtn', 'updatesBackBtn', 'creditsBackBtn',
        'exitBattleBtn', 'confirmBtn'
    ];
    
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                handleButtonClick(btnId);
            });
        }
    });
    
    // NEW: Online multiplayer buttons
    setupOnlineEventListeners();
    
    // Input handling
    document.addEventListener('keydown', (e) => {
        if (gameState.cutsceneActive) return;
        
        const key = e.key.toLowerCase();
        gameState.keys[key] = true;
        
        handleGameInput(key, true);
        
        if (gameState.gameActive && gameState.player.attackCooldown <= 0) {
            if (key === 'z' || key === 'x') {
                doPlayerAttack('punch');
            } else if (key === 'a' || key === 's') {
                doPlayerAttack('kick');
            } else if (key === ' ') {
                doPlayerAttack('parry');
            } else if (key === 'c') {
                doPlayerAttack('special');
            }
        }
    });
    
    document.addEventListener('keyup', (e) => {
        gameState.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('resize', () => {
        if (window.camera && window.renderer) {
            const canvas = document.getElementById('gameCanvas');
            window.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            window.camera.updateProjectionMatrix();
            window.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        }
    });
}

// NEW: Online Event Listeners
function setupOnlineEventListeners() {
    // Online screen buttons
    const onlineButtons = [
        'quickMatchBtn', 'createLobbyBtn', 'joinLobbyBtn', 'friendsBtn',
        'onlineBackBtn', 'refreshLobbiesBtn', 'confirmCreateLobby', 
        'confirmJoinLobby', 'addFriendBtn', 'startMatchBtn', 'leaveLobbyBtn'
    ];
    
    onlineButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                handleOnlineButtonClick(btnId);
            });
        }
    });
}

// UPDATED: Button Click Handler with Online Support
function handleButtonClick(btnId) {
    switch(btnId) {
        case 'arcadeBtn':
            showScreen('characterSelect');
            break;
        case 'onlineBtn':
            showScreen('onlineScreen');
            break;
        case 'practiceBtn':
            showScreen('practiceScreen');
            break;
        case 'shopBtn':
            showScreen('shopScreen');
            break;
        case 'controlsBtn':
            showScreen('controlsScreen');
            break;
        case 'updatesBtn':
            showScreen('updatesScreen');
            break;
        case 'creditsBtn':
            showScreen('creditsScreen');
            break;
        case 'comboPracticeBtn':
        case 'freePracticeBtn':
            gameState.gameMode = 'practice';
            showScreen('characterSelect');
            break;
        case 'dummySettingsBtn':
            alert('Dummy settings: CPU will not attack, perfect for combo practice!');
            break;
        case 'practiceBackBtn':
        case 'backBtn':
        case 'controlsBackBtn':
        case 'shopBackBtn':
        case 'updatesBackBtn':
        case 'creditsBackBtn':
            showScreen('mainMenu');
            break;
        case 'exitBattleBtn':
            if (gameState.gameMode === 'online') {
                leaveOnlineMatch();
            }
            showScreen('characterSelect');
            break;
        case 'confirmBtn':
            startBattle('arcade');
            break;
    }
}

// NEW: Online Button Click Handler
function handleOnlineButtonClick(btnId) {
    switch(btnId) {
        case 'quickMatchBtn':
            if (gameState.selectedCharacter === null) {
                alert('Please select a character first!');
                showScreen('characterSelect');
                return;
            }
            findQuickMatch();
            break;
        case 'createLobbyBtn':
            if (gameState.selectedCharacter === null) {
                alert('Please select a character first!');
                showScreen('characterSelect');
                return;
            }
            document.getElementById('lobbyBrowser').style.display = 'none';
            document.getElementById('createLobby').style.display = 'block';
            document.getElementById('joinLobby').style.display = 'none';
            document.getElementById('friendsList').style.display = 'none';
            break;
        case 'joinLobbyBtn':
            document.getElementById('lobbyBrowser').style.display = 'none';
            document.getElementById('createLobby').style.display = 'none';
            document.getElementById('joinLobby').style.display = 'block';
            document.getElementById('friendsList').style.display = 'none';
            break;
        case 'friendsBtn':
            document.getElementById('lobbyBrowser').style.display = 'none';
            document.getElementById('createLobby').style.display = 'none';
            document.getElementById('joinLobby').style.display = 'none';
            document.getElementById('friendsList').style.display = 'block';
            if (typeof updateFriendsList === 'function') {
                updateFriendsList();
            }
            break;
        case 'onlineBackBtn':
            showScreen('mainMenu');
            break;
        case 'refreshLobbiesBtn':
            if (typeof refreshLobbyList === 'function') {
                refreshLobbyList();
            }
            break;
        case 'confirmCreateLobby':
            const lobbyName = document.getElementById('lobbyName').value || 'Private Lobby';
            const password = document.getElementById('lobbyPassword').value;
            const maxPlayers = parseInt(document.getElementById('lobbyMaxPlayers').value);
            createOnlineLobby(null, lobbyName, password, maxPlayers, false);
            break;
        case 'confirmJoinLobby':
            const lobbyCode = document.getElementById('lobbyCodeInput').value.toUpperCase();
            const joinPassword = document.getElementById('lobbyPasswordInput').value;
            if (lobbyCode) {
                joinLobby(lobbyCode, joinPassword);
            } else {
                alert('Please enter a lobby code!');
            }
            break;
        case 'addFriendBtn':
            const friendCode = document.getElementById('friendCodeInput').value.toUpperCase();
            if (friendCode) {
                addFriend(friendCode);
            } else {
                alert('Please enter a friend code!');
            }
            break;
        case 'startMatchBtn':
            startOnlineMatch();
            break;
        case 'leaveLobbyBtn':
            leaveLobby();
            break;
    }
}

// UPDATED: Game Update with Balanced Boss Mechanics
function update() {
    if (!gameState.player) return;
    
    // Skip updates during cutscene
    if (gameState.cutsceneActive) return;
    
    if (gameState.player.attackCooldown > 0) gameState.player.attackCooldown--;
    if (gameState.cpu && gameState.cpu.attackCooldown > 0) gameState.cpu.attackCooldown--;
    if (gameState.player.parryCooldown > 0) gameState.player.parryCooldown--;
    if (gameState.bossSpecialAttackCooldown > 0) gameState.bossSpecialAttackCooldown--;
    
    // Handle online game update
    if (gameState.gameMode === 'online') {
        updateOnlineGame();
        return;
    }
    
    // Single player game update
    // UPDATED: Balanced BOSS SURVIVAL MODE MECHANICS
    if (gameState.isBossFight) {
        // Update boss self-damage timer (using balanced settings)
        gameState.bossSelfDamageTimer += 1;
        
        // Every 400 frames (reduced from 500) - boss stuns and loses 8% HP (reduced from 10%)
        if (gameState.bossSelfDamageTimer >= BOSS_BALANCED_SETTINGS.selfDamageInterval) {
            gameState.bossSelfDamageTimer = 0;
            
            // Stun boss for shorter duration
            gameState.isBossStunned = true;
            
            // Boss loses 8% HP (reduced from 10%)
            const damage = gameState.cpu.maxHealth * BOSS_BALANCED_SETTINGS.selfDamageAmount;
            gameState.cpu.health = Math.max(0, gameState.cpu.health - damage);
            
            // Create stun effect
            createBossStunEffect();
            
            // Update survival phase
            gameState.survivalPhase++;
            
            // Show boss HP loss message
            const display = document.getElementById('comboDisplay');
            if (display) {
                display.textContent = `67 BOSS STUNNED! -${Math.round(BOSS_BALANCED_SETTINGS.selfDamageAmount * 100)}% HP`;
                display.classList.add('active');
                setTimeout(() => {
                    display.classList.remove('active');
                }, 2000);
            }
            
            // Unstun after shorter duration
            setTimeout(() => {
                gameState.isBossStunned = false;
            }, BOSS_BALANCED_SETTINGS.stunDuration);
        }
        
        // Update player hidden heal timer (more frequent)
        gameState.playerHiddenHealTimer += 1;
        
        // Every 400 frames, player heals to 100% (hidden)
        if (gameState.playerHiddenHealTimer >= BOSS_BALANCED_SETTINGS.playerHealInterval) {
            gameState.playerHiddenHealTimer = 0;
            
            // Player heals to 100% (real HP)
            gameState.playerRealHP = 100;
            
            // Create subtle heal effect
            createPlayerHealEffect();
        }
        
        // Update fake HP with balanced scaling
        if (gameState.playerFakeHP > 1) {
            // UPDATED: More balanced adrenaline effect
            const adrenalineFactor = 1 - (gameState.playerRealHP / 100);
            const fakeHPDamage = 0.08 * (1 - adrenalineFactor * 0.5); // Reduced damage and adrenaline effect
            
            gameState.playerFakeHP = Math.max(1, gameState.playerFakeHP - fakeHPDamage);
        }
        
        // Update displayed HP with fake HP
        gameState.player.health = gameState.player.maxHealth * (gameState.playerFakeHP / 100);
        
        // Player can still die if real HP reaches 0
        if (gameState.playerRealHP <= 0) {
            gameState.player.health = 0;
        }
    }
    
    // Regular game updates...
    // [Rest of the existing update function remains the same]
}

// NEW: Update Online Game
function updateOnlineGame() {
    // Handle player movement
    if (gameState.player.parryCooldown <= 0) {
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
    }
    
    // Send input to server
    sendOnlineInput();
    
    // Update opponent position (would be received from server)
    if (gameState.opponent && window.cpuModel) {
        window.cpuModel.position.x = gameState.opponent.x;
        window.cpuModel.rotation.y = (gameState.opponent.facing === 1 ? 0 : Math.PI);
    }
    
    if (gameState.roundTime > 0 && Math.random() < 0.01) {
        gameState.roundTime--;
        const timerElement = document.getElementById('roundTimer');
        if (timerElement) timerElement.textContent = gameState.roundTime;
    }
    
    if (gameState.player.health <= 0 || (gameState.opponent && gameState.opponent.health <= 0) || gameState.roundTime <= 0) {
        endRound();
    }
}

// NEW: Send Online Input
function sendOnlineInput() {
    if (!gameState.onlineMatch || !onlineState.isOnline) return;
    
    const input = {
        sequence: gameState.lastInputSequence++,
        playerId: onlineState.playerId,
        x: gameState.player.x,
        facing: gameState.player.facing,
        keys: {...gameState.keys},
        timestamp: Date.now()
    };
    
    // In a real implementation, this would send to the server
    // For now, we'll simulate opponent input
    simulateOpponentInput();
}

// NEW: Simulate Opponent Input (placeholder)
function simulateOpponentInput() {
    if (!gameState.opponent) return;
    
    // Simple AI for opponent
    const distance = gameState.opponent.x - gameState.player.x;
    
    if (Math.abs(distance) > 2.5) {
        gameState.opponent.x += (distance > 0 ? -0.05 : 0.05);
    }
    
    gameState.opponent.facing = (distance > 0 ? -1 : 1);
    
    // Random attacks
    if (Math.random() < 0.02 && Math.abs(distance) < 3) {
        // Simulate opponent attack
        createBloodEffect(gameState.player.x, 1, 0);
        applyDamageFlash('player');
        
        const damage = 20 + Math.floor(Math.random() * 30);
        gameState.player.health = Math.max(0, gameState.player.health - damage);
        updateHealthBars();
    }
}

// NEW: Leave Online Match
function leaveOnlineMatch() {
    if (gameState.onlineMatch && onlineState.currentLobby) {
        leaveLobby();
    }
    gameState.onlineMatch = null;
    gameState.opponent = null;
}

// UPDATED: Screen Management with Online Support
function showScreen(screenId) {
    console.log('Showing screen:', screenId);
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        gameState.currentScreen = screenId;
    } else {
        console.error('Screen not found:', screenId);
        return;
    }
    
    // Handle screen-specific initializations
    switch(screenId) {
        case 'onlineScreen':
            if (typeof showOnlineMainScreen === 'function') {
                showOnlineMainScreen();
            }
            if (typeof refreshLobbyList === 'function') {
                refreshLobbyList();
            }
            break;
        case 'gameScreen':
            setTimeout(() => {
                if (typeof initThreeJS === 'function') {
                    initThreeJS();
                }
                startGame();
            }, 100);
            break;
        case 'practiceScreen':
            startPracticeMode();
            break;
        case 'shopScreen':
            setTimeout(() => {
                if (typeof loadShopItems === 'function') {
                    loadShopItems();
                }
            }, 100);
            break;
        case 'characterSelect':
            renderCharacterSelect();
            break;
    }
    
    // Music management
    handleScreenMusic(screenId);
    
    // Touch controls
    const touchControls = document.getElementById('touchControls');
    if (touchControls) {
        touchControls.classList.toggle('active', 
            screenId === 'gameScreen' && gameState.deviceType === 'tablet');
    }
}

// NEW: Handle Screen Music
function handleScreenMusic(screenId) {
    if (screenId === 'gameScreen' && gameState.isBossFight) {
        if (menuMusic && !menuMusic.paused) {
            menuMusic.pause();
        }
        if (bossMusic) {
            bossMusic.currentTime = 0;
            bossMusic.volume = 0.7;
            bossMusic.play().catch(e => {
                console.log("Boss music play failed:", e);
            });
        }
    } else if (screenId !== 'gameScreen') {
        if (bossMusic && !bossMusic.paused) {
            bossMusic.pause();
            bossMusic.currentTime = 0;
        }
        if (menuMusic && menuMusic.paused) {
            menuMusic.currentTime = 0;
            menuMusic.volume = 0.7;
            menuMusic.play().catch(e => {
                console.log("Menu music play failed:", e);
            });
        }
    }
}

// UPDATED: Cutscene with Beat Drop
function startBossCutscene() {
    gameState.cutsceneActive = true;
    gameState.cutsceneTimer = 0;
    gameState.cutsceneTextIndex = 0;
    gameState.currentCutsceneText = "";
    
    // Hide game elements during cutscene
    document.getElementById('gameCanvas').style.opacity = '0.3';
    document.querySelector('.hud').style.opacity = '0.3';
    document.getElementById('touchControls').style.opacity = '0.3';
    
    // Create cutscene overlay
    let cutsceneOverlay = document.getElementById('cutsceneOverlay');
    if (!cutsceneOverlay) {
        cutsceneOverlay = document.createElement('div');
        cutsceneOverlay.id = 'cutsceneOverlay';
        cutsceneOverlay.style.position = 'absolute';
        cutsceneOverlay.style.top = '0';
        cutsceneOverlay.style.left = '0';
        cutsceneOverlay.style.width = '100%';
        cutsceneOverlay.style.height = '100%';
        cutsceneOverlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
        cutsceneOverlay.style.display = 'flex';
        cutsceneOverlay.style.flexDirection = 'column';
        cutsceneOverlay.style.justifyContent = 'center';
        cutsceneOverlay.style.alignItems = 'center';
        cutsceneOverlay.style.zIndex = '50';
        cutsceneOverlay.style.color = '#ffcc00';
        cutsceneOverlay.style.fontSize = '3rem';
        cutsceneOverlay.style.textAlign = 'center';
        cutsceneOverlay.style.padding = '2rem';
        
        const cutsceneText = document.createElement('div');
        cutsceneText.id = 'cutsceneText';
        cutsceneText.style.fontSize = '3rem';
        cutsceneText.style.textShadow = '0 0 10px #ff0033';
        cutsceneText.style.letterSpacing = '3px';
        cutsceneText.style.lineHeight = '1.5';
        cutsceneText.style.maxWidth = '80%';
        
        cutsceneOverlay.appendChild(cutsceneText);
        document.getElementById('gameScreen').appendChild(cutsceneOverlay);
    }
    
    // Start boss music when cutscene starts
    if (bossMusic) {
        bossMusic.currentTime = 0;
        bossMusic.volume = 0.5; // Lower volume for cutscene
        bossMusic.play().catch(e => {
            console.log("Boss music play failed:", e);
        });
    }
    
    // Start cutscene animation
    animateCutscene();
}

// UPDATED: Animate Cutscene with Beat Drop
function animateCutscene() {
    if (!gameState.cutsceneActive) return;
    
    gameState.cutsceneTimer++;
    
    const cutsceneText = document.getElementById('cutsceneText');
    
    if (gameState.cutsceneTimer < 150) {
        if (gameState.cutsceneTextIndex === 0) {
            gameState.currentCutsceneText = BOSS_CUTSCENE_TEXTS[0];
            cutsceneText.textContent = gameState.currentCutsceneText;
            cutsceneText.style.opacity = Math.min(1, gameState.cutsceneTimer / 50).toString();
        }
    } else if (gameState.cutsceneTimer < 300) {
        if (gameState.cutsceneTextIndex === 0) {
            cutsceneText.style.opacity = Math.max(0, 1 - (gameState.cutsceneTimer - 150) / 50).toString();
            if (gameState.cutsceneTimer === 200) {
                gameState.cutsceneTextIndex = 1;
                gameState.currentCutsceneText = BOSS_CUTSCENE_TEXTS[1];
                cutsceneText.textContent = gameState.currentCutsceneText;
                cutsceneText.style.opacity = '0';
            }
        } else if (gameState.cutsceneTextIndex === 1) {
            cutsceneText.style.opacity = Math.min(1, (gameState.cutsceneTimer - 200) / 50).toString();
        }
    } else if (gameState.cutsceneTimer < 450) {
        if (gameState.cutsceneTextIndex === 1) {
            cutsceneText.style.opacity = Math.max(0, 1 - (gameState.cutsceneTimer - 300) / 50).toString();
            if (gameState.cutsceneTimer === 350) {
                gameState.cutsceneTextIndex = 2;
                gameState.currentCutsceneText = BOSS_CUTSCENE_TEXTS[2];
                cutsceneText.textContent = gameState.currentCutsceneText;
                cutsceneText.style.opacity = '0';
            }
        } else if (gameState.cutsceneTextIndex === 2) {
            cutsceneText.style.opacity = Math.min(1, (gameState.cutsceneTimer - 350) / 50).toString();
        }
    } else if (gameState.cutsceneTimer < 600) {
        if (gameState.cutsceneTextIndex === 2) {
            cutsceneText.style.opacity = Math.max(0, 1 - (gameState.cutsceneTimer - 450) / 50).toString();
            if (gameState.cutsceneTimer === 500) {
                gameState.cutsceneTextIndex = 3;
                gameState.currentCutsceneText = BOSS_CUTSCENE_TEXTS[3];
                cutsceneText.textContent = gameState.currentCutsceneText;
                cutsceneText.style.opacity = '0';
            }
        } else if (gameState.cutsceneTextIndex === 3) {
            cutsceneText.style.opacity = Math.min(1, (gameState.cutsceneTimer - 500) / 50).toString();
        }
    } else if (gameState.cutsceneTimer < 750) {
        if (gameState.cutsceneTextIndex === 3) {
            cutsceneText.style.opacity = Math.max(0, 1 - (gameState.cutsceneTimer - 600) / 50).toString();
            if (gameState.cutsceneTimer === 650) {
                gameState.cutsceneTextIndex = 4;
                gameState.currentCutsceneText = BOSS_CUTSCENE_TEXTS[4];
                cutsceneText.textContent = gameState.currentCutsceneText;
                cutsceneText.style.opacity = '0';
            }
        } else if (gameState.cutsceneTextIndex === 4) {
            cutsceneText.style.opacity = Math.min(1, (gameState.cutsceneTimer - 650) / 50).toString();
        }
    } else {
        if (gameState.cutsceneTextIndex === 4) {
            cutsceneText.style.opacity = Math.max(0, 1 - (gameState.cutsceneTimer - 750) / 50).toString();
            if (gameState.cutsceneTimer === 800) {
                gameState.cutsceneTextIndex = 5;
                gameState.currentCutsceneText = BOSS_CUTSCENE_TEXTS[5];
                cutsceneText.textContent = gameState.currentCutsceneText;
                cutsceneText.style.opacity = '1';
                
                // BEAT DROP: Increase music volume and add visual effect
                if (bossMusic) {
                    bossMusic.volume = 0.8; // Increase volume for beat drop
                    // Add screen shake or other effects for beat drop
                    const canvas = document.getElementById('gameCanvas');
                    if (canvas) {
                        canvas.style.transform = 'scale(1.05)';
                        setTimeout(() => {
                            canvas.style.transform = 'scale(1)';
                        }, 200);
                    }
                }
                
                // Final text stays for 2 seconds then ends cutscene
                setTimeout(() => {
                    endCutscene();
                }, 2000);
            }
        }
    }
    
    requestAnimationFrame(animateCutscene);
}

// Initialize when loaded
window.addEventListener('load', init);
